'use client'

import { useEffect, useState } from 'react'
import { getPassenger } from '../services/rides'
import { ApiError } from '../services/api'
import type { Passenger } from '../types'

interface UsePassengerResult {
  data: Passenger | null
  loading: boolean
  error: string | null
}

export function usePassenger(passengerId: string): UsePassengerResult {
  const [data, setData] = useState<Passenger | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!passengerId) return

    setLoading(true)
    setError(null)

    getPassenger(passengerId)
      .then((passenger) => {
        setData(passenger)
      })
      .catch((err) => {
        // 4xx = passageiro não existe no backend (ex: ID mock) — não é erro real
        const status = err instanceof ApiError ? err.status : err?.response?.status
        if (status && status >= 400 && status < 500) {
          setData(null)
        } else {
          setError('Erro ao carregar')
        }
      })
      .finally(() => setLoading(false))
  }, [passengerId])

  return { data, loading, error }
}
