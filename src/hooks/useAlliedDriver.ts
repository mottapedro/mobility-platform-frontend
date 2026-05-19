'use client'

import { useEffect, useState } from 'react'
import { usePassenger } from './usePassenger'
import { formatDriverPhone, type DriverReferralProfile } from '../services/drivers'
import type { Driver } from '../types'

export interface AlliedDriverCardData {
  avatarLabel: string
  name: string
  phoneLabel: string
  regionLabel: string
  vehicleLabel: string
  ratingLabel: string
  headline: string
  rawPhone?: string
}

type StoredReferralDriver = {
  id: string
  name: string
  phone: string
  avatarLabel?: string
  regionLabel?: string
  vehicleLabel?: string
  ratingLabel?: string
  headline?: string
  phoneLabel?: string
} & Partial<DriverReferralProfile>

function buildAvatarLabel(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || 'AL'
}

function toAlliedDriverCardData(
  driver: Driver | null,
  storedDriver: StoredReferralDriver | null,
): AlliedDriverCardData | null {
  const name = driver?.user.name ?? storedDriver?.name
  if (!name) return null

  const backendVehicle = driver?.vehicles[0]
  const vehicleLabel = backendVehicle
    ? [backendVehicle.brand, backendVehicle.model].filter(Boolean).join(' ')
    : storedDriver?.vehicleLabel ?? 'Veículo sob consulta'

  const phone = driver?.user.phone ?? storedDriver?.phone ?? ''

  return {
    avatarLabel: storedDriver?.avatarLabel ?? buildAvatarLabel(name),
    name,
    phoneLabel:
      storedDriver?.phoneLabel ?? (phone ? formatDriverPhone(phone) : 'Contato sob consulta'),
    regionLabel: storedDriver?.regionLabel ?? 'Atendimento sob consulta',
    vehicleLabel,
    ratingLabel: storedDriver?.ratingLabel ?? 'Em breve',
    headline:
      storedDriver?.headline ??
      'Seu parceiro de confiança para corridas com prioridade e atendimento mais pessoal.',
    rawPhone: phone || undefined,
  }
}

interface UseAlliedDriverResult {
  alliedDriver: AlliedDriverCardData | null
  loading: boolean
  error: boolean
}

export function useAlliedDriver(passengerId: string): UseAlliedDriverResult {
  const { data: passenger, loading, error: passengerError } = usePassenger(passengerId)
  const [storedDriver, setStoredDriver] = useState<StoredReferralDriver | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('aliado:referredDriver')
      if (stored) setStoredDriver(JSON.parse(stored) as StoredReferralDriver)
    } catch {
      setStoredDriver(null)
    }
  }, [])

  const alliedDriver = toAlliedDriverCardData(
    passenger?.referredByDriver ?? null,
    storedDriver,
  )

  const error = Boolean(passengerError && !alliedDriver)

  return { alliedDriver, loading, error }
}
