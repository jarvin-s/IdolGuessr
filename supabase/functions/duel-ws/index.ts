import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.75.0"

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void
}

const POLL_MS = 300
const TOUCH_MS = 4_000
const STALE_PING_MS = 12_000
const RECONNECT_AFTER_MS = 300_000
const MAX_PAGES = 5

type EventRow = {
  seq: number
  topic: string
  event: string
  payload: Record<string, unknown> | null
}

type PresenceRow = {
  topic: string
  user_id: string
}

type PollResult = {
  events: EventRow[]
  presence: PresenceRow[]
  head: number
  server_now: string
}

type ClientMessage = {
  type?: string
  topic?: string
  since?: number
}

type SocketState = {
  socket: WebSocket
  userId: string
  topics: Set<string>
  readyTopics: Set<string>
  floor: Map<string, number>
  lastPing: number
  openedAt: number
  closing: boolean
  closed: boolean
}

const sockets = new Set<SocketState>()
const topicSockets = new Map<string, Set<SocketState>>()
const presenceCache = new Map<string, string>()

let cursor = 0
let cursorReady = false
let looping = false
let lastTouch = 0
let cachedServerNow = ""
let tail: Promise<void> = Promise.resolve()

function serviceKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS")
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { default?: string }
      if (parsed.default) return parsed.default
    } catch {
      // Fall through to the legacy service role key.
    }
  }
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!key) throw new Error("Missing service role key")
  return key
}

const supabase: SupabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  serviceKey(),
  { auth: { persistSession: false, autoRefreshToken: false } },
)

function enqueue(task: () => Promise<void>): Promise<void> {
  const run = tail.then(task, task)
  tail = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function safeSend(state: SocketState, message: string) {
  if (state.closed || state.socket.readyState !== WebSocket.OPEN) return
  try {
    state.socket.send(message)
  } catch {
    // The close handler removes the socket.
  }
}

async function pollRpc(topics: string[], since: number, until: number | null): Promise<PollResult> {
  const { data, error } = await supabase.rpc("duel_ws_poll", {
    p_topics: topics,
    p_since: since,
    p_until: until,
  })
  if (error) throw error
  const row = (data ?? {}) as Partial<PollResult>
  return {
    events: Array.isArray(row.events) ? row.events : [],
    presence: Array.isArray(row.presence) ? row.presence : [],
    head: Number(row.head ?? 0),
    server_now: typeof row.server_now === "string" ? row.server_now : new Date().toISOString(),
  }
}

async function ensureCursor() {
  if (cursorReady) return
  const data = await pollRpc([], -1, null)
  cursor = data.head
  cursorReady = true
  cachedServerNow = data.server_now
}

function addTopic(state: SocketState, topic: string) {
  state.topics.add(topic)
  let set = topicSockets.get(topic)
  if (!set) {
    set = new Set()
    topicSockets.set(topic, set)
  }
  set.add(state)
}

function removeTopic(state: SocketState, topic: string) {
  state.topics.delete(topic)
  state.readyTopics.delete(topic)
  state.floor.delete(topic)
  const set = topicSockets.get(topic)
  if (!set) return
  set.delete(state)
  if (set.size === 0) topicSockets.delete(topic)
}

function detach(state: SocketState) {
  if (state.closed) return
  state.closed = true
  sockets.delete(state)
  for (const topic of [...state.topics]) removeTopic(state, topic)
}

function kickLoop() {
  if (looping) return
  looping = true
  void loop()
}

async function loop() {
  while (sockets.size > 0) {
    const started = Date.now()
    try {
      await enqueue(() => tick())
    } catch (error) {
      console.error("duel-ws poll failed", error instanceof Error ? error.message : error)
    }
    await sleep(Math.max(50, POLL_MS - (Date.now() - started)))
  }
  looping = false
}

function emitEvent(state: SocketState, event: EventRow) {
  const seq = Number(event.seq)
  if (seq <= (state.floor.get(event.topic) ?? 0)) return
  safeSend(
    state,
    JSON.stringify({
      type: "event",
      seq,
      topic: event.topic,
      event: event.event,
      payload: event.payload ?? {},
    }),
  )
}

function emitPresence(rows: PresenceRow[], serverNow: string) {
  const grouped = new Map<string, string[]>()
  for (const topic of topicSockets.keys()) grouped.set(topic, [])
  for (const row of rows) {
    const list = grouped.get(row.topic)
    if (list) list.push(String(row.user_id))
  }
  for (const [topic, ids] of grouped) {
    ids.sort()
    const key = ids.join(",")
    if (presenceCache.get(topic) === key) continue
    presenceCache.set(topic, key)
    const message = JSON.stringify({
      type: "presence",
      topic,
      online: ids,
      server_now: serverNow,
    })
    for (const state of topicSockets.get(topic) ?? []) {
      if (!state.readyTopics.has(topic)) continue
      safeSend(state, message)
    }
  }
}

async function touchIfDue() {
  const now = Date.now()
  if (now - lastTouch < TOUCH_MS) return
  lastTouch = now
  const byUser = new Map<string, Set<string>>()
  for (const state of sockets) {
    if (now - state.lastPing > STALE_PING_MS) continue
    let topics = byUser.get(state.userId)
    if (!topics) {
      topics = new Set()
      byUser.set(state.userId, topics)
    }
    for (const topic of state.topics) {
      if (state.readyTopics.has(topic)) topics.add(topic)
    }
  }
  await Promise.all(
    [...byUser].map(async ([userId, topics]) => {
      if (topics.size === 0) return
      const { error } = await supabase.rpc("duel_ws_touch", {
        p_user: userId,
        p_topics: [...topics],
      })
      if (error) console.error("duel-ws touch failed", error.message)
    }),
  )
}

function closeExpired() {
  const now = Date.now()
  for (const state of sockets) {
    if (state.closing || now - state.openedAt < RECONNECT_AFTER_MS) continue
    state.closing = true
    safeSend(state, JSON.stringify({ type: "reconnect" }))
    setTimeout(() => {
      try {
        state.socket.close(1000, "reconnect")
      } catch {
        // Already closed.
      }
    }, 400)
  }
}

async function tick() {
  await ensureCursor()
  const topics = [...topicSockets.keys()]
  if (topics.length === 0) return
  let serverNow = cachedServerNow
  let presence: PresenceRow[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await pollRpc(topics, cursor, null)
    serverNow = data.server_now
    presence = data.presence
    for (const event of data.events) {
      const seq = Number(event.seq)
      if (seq > cursor) cursor = seq
      for (const state of topicSockets.get(event.topic) ?? []) {
        if (!state.readyTopics.has(event.topic)) continue
        emitEvent(state, event)
      }
    }
    if (data.events.length < 200) break
  }
  cachedServerNow = serverNow
  emitPresence(presence, serverNow)
  await touchIfDue()
  closeExpired()
}

async function backfill(state: SocketState, topic: string, since: number, until: number) {
  let from = since
  for (let page = 0; page < MAX_PAGES && from < until; page++) {
    const data = await pollRpc([topic], from, until)
    if (data.events.length === 0) break
    for (const event of data.events) {
      const seq = Number(event.seq)
      emitEvent(state, event)
      if (seq > from) from = seq
    }
    if (data.events.length < 200) break
  }
}

async function handleSubscribe(state: SocketState, topic: string, since: number) {
  if (!topic || topic.length > 80) {
    safeSend(state, JSON.stringify({ type: "error", topic, error: "forbidden" }))
    return
  }
  if (state.topics.has(topic)) {
    safeSend(state, JSON.stringify({ type: "subscribed", topic }))
    return
  }
  const { data, error } = await supabase.rpc("duel_ws_authorize", {
    p_user: state.userId,
    p_topic: topic,
  })
  if (error || !data) {
    safeSend(state, JSON.stringify({ type: "error", topic, error: "forbidden" }))
    return
  }
  await ensureCursor()
  addTopic(state, topic)
  const liveFrom = cursor
  const resumeFrom = Number.isFinite(since) ? since : 0
  state.floor.set(topic, Math.max(liveFrom, resumeFrom))
  if (resumeFrom > 0 && resumeFrom < liveFrom) {
    state.floor.set(topic, resumeFrom)
    await backfill(state, topic, resumeFrom, liveFrom)
    state.floor.set(topic, liveFrom)
  }
  state.readyTopics.add(topic)
  const presence = await pollRpc([topic], cursor, cursor)
  const ids = presence.presence.map((row) => String(row.user_id)).sort()
  presenceCache.set(topic, ids.join(","))
  safeSend(
    state,
    JSON.stringify({
      type: "presence",
      topic,
      online: ids,
      server_now: presence.server_now,
    }),
  )
  safeSend(state, JSON.stringify({ type: "subscribed", topic }))
  kickLoop()
}

function jwtFromRequest(req: Request): string | null {
  const header = req.headers.get("Sec-WebSocket-Protocol") ?? ""
  const protocol = header
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.startsWith("jwt-"))
  if (!protocol) return null
  const jwt = protocol.slice(4)
  return jwt || null
}

async function handleConnection(req: Request, jwt: string): Promise<Response> {
  const { data, error } = await supabase.auth.getUser(jwt)
  if (error || !data.user) {
    return Response.json({ error: "Invalid token" }, { status: 403 })
  }
  const protocol = `jwt-${jwt}`
  const { socket, response } = Deno.upgradeWebSocket(req, { protocol })
  const state: SocketState = {
    socket,
    userId: data.user.id,
    topics: new Set(),
    readyTopics: new Set(),
    floor: new Map(),
    lastPing: Date.now(),
    openedAt: Date.now(),
    closing: false,
    closed: false,
  }
  sockets.add(state)

  const closed = new Promise<void>((resolve) => {
    socket.onclose = () => {
      detach(state)
      resolve()
    }
  })
  socket.onerror = () => {
    try {
      socket.close()
    } catch {
      detach(state)
    }
  }
  socket.onmessage = (event) => {
    void enqueue(async () => {
      if (state.closed) return
      let message: ClientMessage
      try {
        message = JSON.parse(typeof event.data === "string" ? event.data : "") as ClientMessage
      } catch {
        return
      }
      if (message.type === "ping") {
        state.lastPing = Date.now()
        safeSend(state, JSON.stringify({ type: "pong", server_now: cachedServerNow || new Date().toISOString() }))
        return
      }
      if (message.type === "unsubscribe") {
        removeTopic(state, String(message.topic ?? ""))
        return
      }
      if (message.type === "subscribe") {
        await handleSubscribe(state, String(message.topic ?? ""), Number(message.since ?? 0))
      }
    })
  }

  try {
    EdgeRuntime.waitUntil(closed)
  } catch {
    // Local runtimes without EdgeRuntime still keep the socket on the request.
  }
  return response
}

Deno.serve(async (req) => {
  const upgrade = req.headers.get("upgrade") ?? ""
  if (upgrade.toLowerCase() !== "websocket") {
    return Response.json({ error: "request isn't trying to upgrade to WebSocket." }, { status: 400 })
  }
  const jwt = jwtFromRequest(req)
  if (!jwt) return Response.json({ error: "Auth token not provided" }, { status: 403 })
  return handleConnection(req, jwt)
})
