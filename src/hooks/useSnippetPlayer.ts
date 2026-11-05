'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SLICES = 16
const START_DELAY = 0.05
const FADE = 0.006

type AudioContextConstructor = typeof AudioContext

function createContext() {
    const Context: AudioContextConstructor | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioContextConstructor })
            .webkitAudioContext
    return Context ? new Context() : null
}

function runsOf(pieces: number[]) {
    const runs: number[][] = []
    for (const piece of pieces) {
        const last = runs[runs.length - 1]
        if (last && last[last.length - 1] + 1 === piece) last.push(piece)
        else runs.push([piece])
    }
    return runs
}

export function useSnippetPlayer(previewUrl: string | null) {
    const contextRef = useRef<AudioContext | null>(null)
    const masterRef = useRef<GainNode | null>(null)
    const bufferRef = useRef<Promise<AudioBuffer | null> | null>(null)
    const sourcesRef = useRef<AudioBufferSourceNode[]>([])
    const timersRef = useRef<number[]>([])
    const generation = useRef(0)
    const volumeRef = useRef(1)
    const [playing, setPlaying] = useState(false)
    const [activePiece, setActivePiece] = useState<number | null>(null)
    const [volume, setVolumeState] = useState(1)

    const getContext = useCallback(() => {
        if (contextRef.current) return contextRef.current
        const context = createContext()
        if (!context) return null
        const master = context.createGain()
        master.gain.value = volumeRef.current
        master.connect(context.destination)
        contextRef.current = context
        masterRef.current = master
        return context
    }, [])

    const setVolume = useCallback((value: number) => {
        const next = Math.min(1, Math.max(0, value))
        volumeRef.current = next
        setVolumeState(next)
        if (masterRef.current) masterRef.current.gain.value = next
    }, [])

    const silence = useCallback(() => {
        for (const timer of timersRef.current) window.clearTimeout(timer)
        timersRef.current = []
        for (const source of sourcesRef.current) {
            try {
                source.stop()
            } catch {
                // Already stopped.
            }
            source.disconnect()
        }
        sourcesRef.current = []
    }, [])

    useEffect(() => {
        if (!previewUrl) return
        const context = getContext()
        if (!context) return
        let cancelled = false
        bufferRef.current = fetch(previewUrl)
            .then((response) => {
                if (!response.ok) throw new Error('Could not load the preview')
                return response.arrayBuffer()
            })
            .then((data) => context.decodeAudioData(data))
            .catch((error: unknown) => {
                if (!cancelled) console.error(error)
                return null
            })
        return () => {
            cancelled = true
            generation.current += 1
            silence()
            bufferRef.current = null
            setPlaying(false)
            setActivePiece(null)
        }
    }, [previewUrl, getContext, silence])

    useEffect(() => {
        return () => {
            void contextRef.current?.close()
            contextRef.current = null
            masterRef.current = null
        }
    }, [])

    const stop = useCallback(() => {
        generation.current += 1
        silence()
        setPlaying(false)
        setActivePiece(null)
    }, [silence])

    const playSequence = useCallback(
        (pieces: number[]) => {
            const context = getContext()
            const master = masterRef.current
            const pending = bufferRef.current
            if (!context || !master || !pending || pieces.length === 0) return
            const token = ++generation.current
            silence()
            setPlaying(true)
            setActivePiece(pieces[0])
            void context.resume()
            void (async () => {
                const buffer = await pending
                if (generation.current !== token) return
                if (!buffer) {
                    setPlaying(false)
                    setActivePiece(null)
                    return
                }
                const slice = buffer.duration / SLICES
                const startAt = context.currentTime + START_DELAY
                let at = startAt

                for (const run of runsOf(pieces)) {
                    const length = run.length * slice
                    const gain = context.createGain()
                    gain.connect(master)
                    gain.gain.setValueAtTime(0, at)
                    gain.gain.linearRampToValueAtTime(1, at + FADE)
                    gain.gain.setValueAtTime(1, at + length - FADE)
                    gain.gain.linearRampToValueAtTime(0, at + length)

                    const source = context.createBufferSource()
                    source.buffer = buffer
                    source.connect(gain)
                    source.onended = () => gain.disconnect()
                    source.start(at, run[0] * slice, length)
                    sourcesRef.current.push(source)

                    run.forEach((piece, index) => {
                        const delay =
                            (at + index * slice - context.currentTime) * 1000
                        timersRef.current.push(
                            window.setTimeout(() => {
                                if (generation.current === token)
                                    setActivePiece(piece)
                            }, Math.max(0, delay))
                        )
                    })
                    at += length
                }

                timersRef.current.push(
                    window.setTimeout(
                        () => {
                            if (generation.current !== token) return
                            sourcesRef.current = []
                            timersRef.current = []
                            setPlaying(false)
                            setActivePiece(null)
                        },
                        Math.max(0, (at - context.currentTime) * 1000)
                    )
                )
            })()
        },
        [getContext, silence]
    )

    const playSlice = useCallback(
        (piece: number) => playSequence([piece]),
        [playSequence]
    )

    const unlock = useCallback(async () => {
        const context = getContext()
        if (!context) return
        try {
            await context.resume()
        } catch {
            // Playback starts on the next tap if the browser still blocks it.
        }
    }, [getContext])

    return {
        playSlice,
        playSequence,
        stop,
        unlock,
        playing,
        activePiece,
        volume,
        setVolume,
    }
}
