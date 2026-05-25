'use client'

import { useEffect } from 'react'
import {
  type ReferralInviteType,
  setStoredOriginPassengerId,
  setStoredReferralCode,
  setStoredReferralInvite,
} from '../../utils/referral'

interface ReferralCaptureProps {
  referralCode: string
  inviteType: ReferralInviteType
  originPassengerId?: string
  originDriverId?: string
  name?: string
}

export function ReferralCapture({
  referralCode,
  inviteType,
  originPassengerId,
  originDriverId,
  name,
}: ReferralCaptureProps) {
  useEffect(() => {
    if (!referralCode) return

    setStoredReferralCode(localStorage, referralCode)
    setStoredReferralInvite(localStorage, {
      type: inviteType,
      referralCode,
      originPassengerId,
      originDriverId,
      name,
    })

    if (originPassengerId) {
      setStoredOriginPassengerId(localStorage, originPassengerId)
    }
  }, [inviteType, name, originDriverId, originPassengerId, referralCode])

  return null
}
