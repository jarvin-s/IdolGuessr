import DailyClient from './daily-client'
import { loadCurrentDaily } from '@/lib/game/actions'

export default async function Home() {
    const initialDaily = await loadCurrentDaily()
    return <DailyClient initialDaily={initialDaily} />
}
