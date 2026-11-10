'use client'

import { useFeedbackNotice } from '@/components/feedback/FeedbackNoticeProvider'

export function useFeedbackUnread(): number {
    return useFeedbackNotice().unreadCount
}
