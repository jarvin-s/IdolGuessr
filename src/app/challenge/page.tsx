'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChallengeCreateModal from '@/components/challenge/ChallengeCreateModal'
import { createChallenge, getOrCreateSessionId } from '@/lib/supabase'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'
type IdolCount = 5 | 10 | 15 | 20

export default function ChallengePage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (idolCount: IdolCount, groupFilter: GroupFilter) => {
    setIsCreating(true)
    setError(null)

    try {
      const sessionId = getOrCreateSessionId()
      const challengeId = await createChallenge(sessionId, idolCount, groupFilter)

      if (challengeId) {
        router.push(`/challenge/${challengeId}`)
      } else {
        setError('Failed to create challenge. Please try again.')
        setIsCreating(false)
      }
    } catch (err) {
      console.error('Error creating challenge:', err)
      setError('Failed to create challenge. Please try again.')
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    router.push('/')
  }

  return (
    <div className='fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white'>
      <ChallengeCreateModal
        isOpen={true}
        isCreating={isCreating}
        onClose={handleClose}
        onCreate={handleCreate}
      />

      {error && (
        <div className='fixed bottom-8 left-1/2 -translate-x-1/2 rounded-lg bg-red-500 px-4 py-2 text-white shadow-lg'>
          {error}
        </div>
      )}
    </div>
  )
}
