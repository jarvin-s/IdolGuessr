'use client'

import { useState } from 'react'
import copy from 'copy-to-clipboard'
import ShareModal from './ShareModal'
import { useShareImage } from '@/hooks/useShareImage'
import { generateShareText } from '@/utils/shareText'

interface ShareButtonProps {
    correctAnswer: string
    guessCount: number
    pixelatedImageSrc: string
    isWin: boolean
    className?: string
}

export default function ShareButton({
    correctAnswer,
    guessCount,
    pixelatedImageSrc,
    isWin,
    className = '',
}: ShareButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [copyStatus, setCopyStatus] = useState<
        'idle' | 'copied-png' | 'copied-text'
    >('idle')

    const { generateShareImageBlob } = useShareImage({
        pixelatedImageSrc,
        guessCount,
    })

    const handleCopyPNG = async () => {
        setIsGenerating(true)
        setCopyStatus('copied-png')

        try {
            const blob = await generateShareImageBlob()

            if (!blob) {
                alert('Failed to generate image. Please try again.')
                return
            }

            try {
                const clipboardItem = new ClipboardItem({ 'image/png': blob })
                await navigator.clipboard.write([clipboardItem])
                setCopyStatus('copied-png')
                setTimeout(() => {
                    setCopyStatus('idle')
                    setIsModalOpen(false)
                }, 2000)
            } catch {
                const fileName = `idolguessr-${correctAnswer}-${guessCount}turns.png`
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = fileName
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                setIsModalOpen(false)
            }
        } catch (error) {
            console.error('Error copying PNG:', error)
            alert('Failed to copy image. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopyText = () => {
        const textResult = generateShareText({ guessCount, isWin })

        const success = copy(textResult)
        if (success) {
            setCopyStatus('copied-text')
            setTimeout(() => {
                setCopyStatus('idle')
                setIsModalOpen(false)
            }, 2000)
        } else {
            alert('Failed to copy text. Please try again.')
        }
    }

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-full bg-black px-6 py-3 font-semibold text-white transition-colors hover:bg-gray-800 ${className}`}
            >
                <svg
                    className='h-5 w-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                >
                    <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
                    />
                </svg>
                Share
            </button>

            <ShareModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCopyPNG={handleCopyPNG}
                onCopyText={handleCopyText}
                isGenerating={isGenerating}
                copyStatus={copyStatus}
            />
        </>
    )
}
