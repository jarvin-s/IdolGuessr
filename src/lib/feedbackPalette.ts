export type FeedbackTone = 'correct' | 'partial' | 'wrong' | 'higher' | 'lower'

type Palette = Record<FeedbackTone, string> & {
    dotCorrect: string
    dotWrong: string
    bannerCorrect: string
    bannerWrong: string
    ring: string
    matched: string
}

const DEFAULT_PALETTE: Palette = {
    correct: 'bg-[#3aa346]',
    partial: 'bg-[#e39b2b]',
    wrong: 'bg-[#d64545]',
    higher: 'bg-[#d64545]',
    lower: 'bg-[#d64545]',
    dotCorrect: 'bg-[#3aa346]',
    dotWrong: 'bg-[#d64545]',
    bannerCorrect: 'bg-[#3aa346]',
    bannerWrong: 'bg-[#d64545]',
    ring: 'border-[#3aa346]',
    matched: 'bg-[#3aa346]',
}

// Blue and orange stay apart for red-green blindness. Incorrect is darker than both.
const COLORBLIND_PALETTE: Palette = {
    correct: 'bg-[#0072B2]',
    partial: 'bg-[#E69F00]',
    wrong: 'bg-[#4D4D4D]',
    higher: 'bg-[#4D4D4D]',
    lower: 'bg-[#4D4D4D]',
    dotCorrect: 'bg-[#56B4E9]',
    dotWrong: 'bg-[#E8E8E8]',
    bannerCorrect: 'bg-[#0072B2]',
    bannerWrong: 'bg-[#4D4D4D]',
    ring: 'border-[#56B4E9]',
    matched: 'bg-[#0072B2]',
}

export function feedbackPalette(colorblind: boolean): Palette {
    return colorblind ? COLORBLIND_PALETTE : DEFAULT_PALETTE
}

export function feedbackToneClass(tone: FeedbackTone, colorblind: boolean) {
    return feedbackPalette(colorblind)[tone]
}
