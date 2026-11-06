import { useCallback } from 'react'

interface UseShareImageProps {
    pixelatedImageSrc: string
    guessCount: number
}

export function useShareImage({
    pixelatedImageSrc,
    guessCount,
}: UseShareImageProps) {
    const generateShareImageBlob = useCallback(async (): Promise<Blob | null> => {
        try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) return null

            const width = 1080
            const height = 1920
            canvas.width = width
            canvas.height = height

            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, width, height)

            const framePadding = 35
            const frameWidth = width - framePadding * 2
            const frameHeight = height - framePadding * 2
            const frameX = framePadding
            const frameY = framePadding
            const frameRadius = 25

            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.roundRect(frameX, frameY, frameWidth, frameHeight, frameRadius)
            ctx.fill()

            const img = new Image()
            img.crossOrigin = 'anonymous'

            await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
                img.src = pixelatedImageSrc
            })

            const imageSize = frameWidth - 100
            const imageX = frameX + (frameWidth - imageSize) / 2
            const imageY = frameY + 50
            const cornerRadius = 20

            ctx.save()

            ctx.beginPath()
            ctx.roundRect(imageX, imageY, imageSize, imageSize, cornerRadius)
            ctx.clip()

            // Draw the pre-pixelated image directly (no additional pixelation needed)
            ctx.drawImage(img, imageX, imageY, imageSize, imageSize)

            ctx.restore()

            const blockSpacing = 15
            const totalBlocksWidth = imageSize
            const blocksStartX = imageX
            const blocksY = imageY + imageSize + 30
            const blockWidth = (totalBlocksWidth - 5 * blockSpacing) / 6
            const blockHeight = blockWidth

            for (let i = 0; i < 6; i++) {
                const blockX = blocksStartX + i * (blockWidth + blockSpacing)

                if (i === guessCount - 1) {
                    ctx.fillStyle = '#4ade80'
                    ctx.beginPath()
                    ctx.roundRect(blockX, blocksY, blockWidth, blockHeight, 12)
                    ctx.fill()
                } else if (i < guessCount) {
                    ctx.fillStyle = '#000000'
                    ctx.beginPath()
                    ctx.roundRect(blockX, blocksY, blockWidth, blockHeight, 12)
                    ctx.fill()

                    ctx.strokeStyle = '#ffffff'
                    ctx.lineWidth = 5
                    ctx.lineCap = 'round'
                    const padding = 55
                    ctx.beginPath()
                    ctx.moveTo(blockX + padding, blocksY + padding)
                    ctx.lineTo(
                        blockX + blockWidth - padding,
                        blocksY + blockHeight - padding
                    )
                    ctx.moveTo(blockX + blockWidth - padding, blocksY + padding)
                    ctx.lineTo(
                        blockX + padding,
                        blocksY + blockHeight - padding
                    )
                    ctx.stroke()
                } else {
                    ctx.fillStyle = '#e5e7eb'
                    ctx.beginPath()
                    ctx.roundRect(blockX, blocksY, blockWidth, blockHeight, 12)
                    ctx.fill()
                }
            }

            ctx.fillStyle = '#000000'
            ctx.font = 'bold 72px Arial, sans-serif'
            ctx.textAlign = 'center'

            const resultText = `I guessed today's\nidol in ${guessCount} ${guessCount === 1 ? 'turn' : 'turns'}!`
            const textY = blocksY + blockHeight + 150

            const lines = resultText.split('\n')
            lines.forEach((line, index) => {
                ctx.fillText(line, frameX + frameWidth / 2, textY + index * 90)
            })

            const today = new Date()
            const dateStr = today.toLocaleDateString('en-GB')
            ctx.font = '48px Arial, sans-serif'
            ctx.fillStyle = '#666666'
            ctx.fillText(dateStr, frameX + frameWidth / 2, textY + 200)

            const brandingY = frameY + frameHeight - 100

            const logoImg = new Image()
            logoImg.crossOrigin = 'anonymous'

            try {
                await new Promise((resolve, reject) => {
                    logoImg.onload = resolve
                    logoImg.onerror = reject
                    logoImg.src = '/images/idolguessr-logo.webp'
                })

                const logoWidth = 300
                const logoHeight = 135
                ctx.drawImage(
                    logoImg,
                    frameX + 50,
                    brandingY - 65,
                    logoWidth,
                    logoHeight
                )
            } catch {
                ctx.font = 'bold 64px Arial, sans-serif'
                ctx.fillStyle = '#000000'
                ctx.textAlign = 'left'
                ctx.fillText('idol', frameX + 50, brandingY)
                ctx.fillText('guessr', frameX + 50, brandingY + 80)
            }

            ctx.font = '32px Arial, sans-serif'
            ctx.fillStyle = '#000000'
            ctx.textAlign = 'right'
            ctx.fillText('PLAY AT', frameX + frameWidth - 50, brandingY)
            ctx.font = 'bold 48px Arial, sans-serif'
            ctx.fillText(
                'idolguessr.fun',
                frameX + frameWidth - 50,
                brandingY + 50
            )

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob)
                }, 'image/png')
            })
        } catch (error) {
            console.error('Error generating share image:', error)
            return null
        }
    }, [pixelatedImageSrc, guessCount])

    return { generateShareImageBlob }
}

