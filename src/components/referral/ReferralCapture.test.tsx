import { render, waitFor } from '@testing-library/react'
import { ReferralCapture } from './ReferralCapture'
import {
  ORIGIN_PASSENGER_ID_STORAGE_KEY,
  REFERRAL_CODE_STORAGE_KEY,
  REFERRAL_INVITE_STORAGE_KEY,
} from '../../utils/referral'

describe('ReferralCapture', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists passenger referral metadata on landing', async () => {
    render(
      <ReferralCapture
        referralCode="maria-lucia-7x2a"
        inviteType="passenger"
        originPassengerId="passenger-123"
        name="Maria Lucia"
      />,
    )

    await waitFor(() => {
      expect(localStorage.getItem(REFERRAL_CODE_STORAGE_KEY)).toBe('maria-lucia-7x2a')
    })

    expect(localStorage.getItem(ORIGIN_PASSENGER_ID_STORAGE_KEY)).toBe('passenger-123')
    expect(JSON.parse(localStorage.getItem(REFERRAL_INVITE_STORAGE_KEY) ?? '{}')).toEqual({
      type: 'passenger',
      referralCode: 'maria-lucia-7x2a',
      originPassengerId: 'passenger-123',
      name: 'Maria Lucia',
    })
  })
})
