import type { ClassicFeedback } from '@/lib/classic'

export const GUESS_COLUMNS: Array<{
    key: keyof Pick<
        ClassicFeedback,
        'group' | 'gender' | 'gen' | 'agency' | 'nationality' | 'positions' | 'birth_year' | 'height'
    >
    label: string
}> = [
    { key: 'group', label: 'Group' },
    { key: 'gender', label: 'Gender' },
    { key: 'gen', label: 'Gen' },
    { key: 'agency', label: 'Agency' },
    { key: 'nationality', label: 'Nationality' },
    { key: 'positions', label: 'Positions' },
    { key: 'birth_year', label: 'Birth year' },
    { key: 'height', label: 'Height' },
]
