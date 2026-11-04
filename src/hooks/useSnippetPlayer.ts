'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SLICES = 16

export function useSnippetPlayer(previewUrl: string | null) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const generation = useRef(0)
    const [playing, setPlaying] = useState(false)

    useEffect(() => {
        if (!previewUrl) return
        const audio = new Audio(previewUrl)
        audio.preload = 'auto'
        audioRef.current = audio
        return () => {
            generation.current += 1
            audio.pause()
            audioRef.current = null
        }
    }, [previewUrl])

    const stop = useCallback(() => {
        generation.current += 1
        audioRef.current?.pause()
        setPlaying(false)
    }, [])

    const whenReady = useCallback((audio: HTMLAudioElement) => {
        if (Number.isFinite(audio.duration)) return Promise.resolve()
        return new Promise<void>((resolve) => {
            audio.addEventListener('loadedmetadata', () => resolve(), {
                once: true,
            })
        })
    }, [])

    const playRange = useCallback((from: number, to: number, token: number) => {
        const audio = audioRef.current
        if (!audio) return Promise.resolve()
        return new Promise<void>((resolve) => {
            const finish = () => {
                audio.removeEventListener('timeupdate', onTime)
                audio.removeEventListener('ended', finish)
                resolve()
            }
            const onTime = () => {
                if (
                    generation.current !== token ||
                    audio.currentTime >= to - 0.03
                ) {
                    if (generation.current === token) audio.pause()
                    finish()
                }
            }
            if (generation.current !== token) {
                finish()
                return
            }
            audio.currentTime = from
            audio.addEventListener('timeupdate', onTime)
            audio.addEventListener('ended', finish)
            void audio.play().catch(() => finish())
        })
    }, [])

    const playSlice = useCallback(
        (piece: number) => {
            const audio = audioRef.current
            if (!audio) return
            const token = ++generation.current
            setPlaying(true)
            void (async () => {
                await whenReady(audio)
                if (generation.current !== token) return
                const slice = audio.duration / SLICES
                await playRange(piece * slice, (piece + 1) * slice, token)
                if (generation.current === token) setPlaying(false)
            })()
        },
        [playRange, whenReady]
    )

    const playSequence = useCallback(
        (pieces: number[]) => {
            const audio = audioRef.current
            if (!audio || pieces.length === 0) return
            const token = ++generation.current
            setPlaying(true)
            void (async () => {
                await whenReady(audio)
                if (generation.current !== token) return
                const slice = audio.duration / SLICES
                for (const piece of pieces) {
                    if (generation.current !== token) return
                    await playRange(piece * slice, (piece + 1) * slice, token)
                }
                if (generation.current === token) setPlaying(false)
            })()
        },
        [playRange, whenReady]
    )

    const unlock = useCallback(async () => {
        const audio = audioRef.current
        if (!audio) return
        try {
            await audio.play()
            audio.pause()
            audio.currentTime = 0
        } catch {
            // Playback starts on the next tap if the browser still blocks it.
        }
    }, [])

    return { playSlice, playSequence, stop, unlock, playing }
}
