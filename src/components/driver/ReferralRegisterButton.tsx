'use client'

import { useRouter } from 'next/navigation'
import type { DriverSummary } from '../../services/drivers'
import { setStoredReferralCode } from '../../utils/referral'

type ReferralRegisterButtonProps = {
  driver: DriverSummary
  slug: string
}

export function ReferralRegisterButton({ driver, slug }: ReferralRegisterButtonProps) {
  const router = useRouter()

  function handleClick() {
    localStorage.setItem('aliado:referredDriver', JSON.stringify(driver))
    localStorage.setItem('aliado:referredSlug', slug)
    setStoredReferralCode(localStorage, slug)
    router.push(`/register?ref=${encodeURIComponent(slug)}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-2xl bg-[#F28C28] px-6 py-4 text-base font-semibold text-[#120b07] transition-transform hover:scale-[1.01] hover:bg-[#ff9f43] active:scale-[0.99]"
    >
      Agendar corrida com este motorista
    </button>
  )
}