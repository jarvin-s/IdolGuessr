export interface ScatterSpot {
    group: 0 | 1
    index: number
    rotate: number
    jx: number
    jy: number
}

const SIDE_ANCHORS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
    [
        [56, 11],
        [82, 8],
        [50, 34],
        [80, 37],
        [58, 57],
        [84, 61],
        [68, 86],
    ],
    [
        [16, 9],
        [44, 8],
        [48, 36],
        [12, 58],
        [40, 62],
        [18, 84],
        [46, 88],
    ],
]

const BAND_ANCHORS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
    [
        [14, 30],
        [38, 28],
        [62, 34],
        [86, 30],
        [26, 74],
        [50, 70],
        [74, 76],
    ],
    [
        [16, 28],
        [40, 34],
        [64, 26],
        [88, 32],
        [24, 72],
        [50, 76],
        [76, 68],
    ],
]

const LOOSE_PIECES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

function mulberry32(seed: number) {
    let state = seed >>> 0
    return () => {
        state = (state + 0x6d2b79f5) | 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

export function scatterSpots(seed: number): Map<number, ScatterSpot> {
    const rand = mulberry32(seed || 1)
    const pieces = [...LOOSE_PIECES]
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1))
        const swap = pieces[i]
        pieces[i] = pieces[j]
        pieces[j] = swap
    }
    const spots = new Map<number, ScatterSpot>()
    pieces.forEach((piece, slot) => {
        spots.set(piece, {
            group: slot < 7 ? 0 : 1,
            index: slot % 7,
            rotate: Math.round((rand() * 28 - 14) * 10) / 10,
            jx: Math.round((rand() * 8 - 4) * 10) / 10,
            jy: Math.round((rand() * 6 - 3) * 10) / 10,
        })
    })
    return spots
}

export function scatterPosition(
    spot: ScatterSpot,
    wide: boolean
): { x: number; y: number; rotate: number } {
    const anchors = (wide ? SIDE_ANCHORS : BAND_ANCHORS)[spot.group]
    const anchor = anchors[spot.index] ?? anchors[0]
    return {
        x: clamp(anchor[0] + spot.jx, 8, 92),
        y: clamp(anchor[1] + spot.jy, 10, 90),
        rotate: spot.rotate,
    }
}
