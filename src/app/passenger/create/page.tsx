'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createRide } from '../../../services/rides'
import { ApiError } from '../../../services/api'
import { usePassenger } from '../../../hooks/usePassenger'
import { useAuth } from '../../../contexts/AuthContext'
import { AddressInput, type AddressCoords } from '../../../components/passenger/AddressInput'
import type { DriverSummary } from '../../../services/drivers'

interface ContextCheckboxProps {
  label: string
  emoji: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ContextCheckbox({ label, emoji, checked, onChange }: ContextCheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
        checked
          ? 'border-[#F28C28]/60 bg-[#F28C28]/10 text-[#F28C28]'
          : 'border-[#2E1A08] bg-[#1A0E04] text-[#9A7D5A] hover:border-[#5A3F22]'
      }`}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {checked && <span className="ml-auto text-[#F28C28]">✓</span>}
    </button>
  )
}

export default function PassengerCreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const passengerId = user?.passengerId ?? ''

  const [origin, setOrigin] = useState('')
  const [originCoords, setOriginCoords] = useState<AddressCoords | null>(null)
  const [destination, setDestination] = useState('')
  const [destCoords, setDestCoords] = useState<AddressCoords | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [isVip, setIsVip] = useState(false)
  const [isAirport, setIsAirport] = useState(false)
  const [isAssistedTransport, setIsAssistedTransport] = useState(false)
  const [isLuggage, setIsLuggage] = useState(false)

  const { data, loading, error } = usePassenger(passengerId)

  const [localDriver, setLocalDriver] = useState<DriverSummary | null>(null)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aliado:referredDriver')
      if (stored) setLocalDriver(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const referredDriver = data?.referredByDriver
    ? { name: data.referredByDriver.user.name, phone: data.referredByDriver.user.phone }
    : localDriver
      ? { name: localDriver.name, phone: localDriver.phone }
      : null

  const showDriverLoadError = Boolean(error && !referredDriver)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!origin.trim() || !destination.trim() || !scheduledAt) {
      setSubmitError('Preencha todos os campos obrigatórios.')
      return
    }

    console.log('[CreateRide] Validação de coordenadas:', { originCoords, destCoords })
    if (!originCoords?.lat || !destCoords?.lat) {
      alert('Por favor, selecione os endereços de origem e destino na lista de sugestões.')
      setSubmitError('Selecione os endereços de origem e destino na lista de sugestões para garantir dados de localização precisos.')
      return
    }

    if (new Date(scheduledAt) <= new Date()) {
      setSubmitError('A data deve ser futura.')
      return
    }

    console.log('[CreateRide] Coordenadas:', {
      originCoords,
      destCoords,
    })
    const payload = {
      passengerId,
      origin: origin.trim(),
      destination: destination.trim(),
      scheduledAt: new Date(scheduledAt).toISOString(),
      context: { isVip, isAirport, isAssistedTransport, isLuggage },
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      ...(originCoords ? { originLat: originCoords.lat, originLng: originCoords.lng } : {}),
      ...(destCoords ? { destinationLat: destCoords.lat, destinationLng: destCoords.lng } : {}),
    }
    console.log('[CreateRide] Payload final:', payload)

    setSubmitting(true)
    try {
      const { ride } = await createRide(payload)
      const stored = localStorage.getItem('passengerRideIds')
      const ids: string[] = stored ? JSON.parse(stored) : []
      ids.unshift(ride.id)
      localStorage.setItem('passengerRideIds', JSON.stringify(ids))
      // reset
      setOrigin('')
      setOriginCoords(null)
      setDestination('')
      setDestCoords(null)
      setScheduledAt('')
      setIsVip(false)
      setIsAirport(false)
      setIsAssistedTransport(false)
      setIsLuggage(false)
      setNotes('')
      router.push('/passenger/rides')
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') console.error('[createRide]', err)
      const msg =
        err instanceof ApiError
          ? err.message
          : (err as Error)?.message ?? 'Erro ao criar corrida.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#F5ECD8]">Solicitar corrida</h1>
        <p className="mt-1 text-sm text-[#9A7D5A]">Passageiro ALIADO</p>
      </div>

      {/* Motorista aliado */}
      <div className={`mb-6 rounded-2xl border p-4 ${
            referredDriver
              ? 'border-[#F28C28]/40 bg-[#1A0E04]'
              : 'border-[#2E1A08] bg-[#1A0E04]'
          }`}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#F28C28]/70">
          Motorista aliado indicado
        </p>

        {loading && (
          <p className="text-sm text-[#9A7D5A]">Carregando motorista aliado...</p>
        )}

        {showDriverLoadError && (
          <p className="text-sm text-[#E05050]">Erro ao carregar motorista</p>
        )}

        {referredDriver && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F28C28] text-sm font-bold text-[#0D0700]">
                {referredDriver.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[#F5ECD8]">{referredDriver.name}</p>
                {referredDriver.phone && (
                  <p className="text-xs text-[#9A7D5A]">{referredDriver.phone}</p>
                )}
              </div>
            </div>
            <p className="mt-1 rounded-lg border border-[#3DB87A]/30 bg-[#3DB87A]/8 px-3 py-2 text-xs font-medium text-[#3DB87A]">
              ✓ Seu motorista receberá a corrida primeiro
            </p>
          </div>
        )}

        {!loading && !referredDriver && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-[#9A7D5A]">
              💡 Vincule um motorista para prioridade nas corridas
            </p>
            <button
              type="button"
              onClick={() => router.push('/register')}
              className="w-fit rounded-xl border border-[#F28C28]/30 px-4 py-2 text-xs font-semibold text-[#F28C28] transition-colors hover:border-[#F28C28] hover:bg-[#F28C28]/10"
            >
              Vincular agora
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AddressInput
          id="origin"
          label="Origem"
          placeholder="Ex: Barra da Tijuca, Rio de Janeiro"
          value={origin}
          required
          onChange={(val, coords) => {
            const normalized = coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' ? coords : null
            console.log('[Page] Origin onChange:', { val, coords, normalized })
            setOrigin(val)
            setOriginCoords(normalized)
          }}
        />

        <AddressInput
          id="destination"
          label="Destino"
          placeholder="Ex: Aeroporto Galeão, Rio de Janeiro"
          value={destination}
          required
          onChange={(val, coords) => {
            const normalized = coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' ? coords : null
            console.log('[Page] Destination onChange:', { val, coords, normalized })
            setDestination(val)
            setDestCoords(normalized)
          }}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#F5ECD8]/70">Horário da corrida</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="rounded-xl border border-[#2E1A08] bg-[#1A0E04] px-4 py-3 text-sm text-[#F5ECD8] outline-none focus:border-[#F28C28]/60 transition-colors scheme-dark"
          />
        </div>

        {/* Transporte Assistido highlight */}
        <button
          type="button"
          onClick={() => setIsAssistedTransport((v) => !v)}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-all ${
            isAssistedTransport
              ? 'border-violet-500/40 bg-violet-500/8'
              : 'border-[#2E1A08] bg-[#1A0E04] hover:border-[#5A3F22]'
          }`}
        >
          <span className="text-2xl">♿</span>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${isAssistedTransport ? 'text-violet-300' : 'text-[#F5ECD8]'}`}>
              Precisa de auxílio durante a corrida?
            </p>
            <p className="mt-0.5 text-xs text-[#9A7D5A]">
              Transporte Assistido — acompanhamento, cadeirante ou mobilidade reduzida
            </p>
          </div>
          {isAssistedTransport && (
            <span className="shrink-0 rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">✓ Ativo</span>
          )}
        </button>

        <div className="flex flex-col gap-3 rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9A7D5A]">
            Informações adicionais
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ContextCheckbox emoji="⭐" label="VIP" checked={isVip} onChange={setIsVip} />
            <ContextCheckbox emoji="✈️" label="Aeroporto" checked={isAirport} onChange={setIsAirport} />
            <ContextCheckbox emoji="🧳" label="Bagagem" checked={isLuggage} onChange={setIsLuggage} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[#F5ECD8]/70">Observações</label>
          <textarea
            rows={3}
            placeholder="Ex: Preciso de espaço para cadeira de rodas, embarque no portão 2..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none rounded-xl border border-[#2E1A08] bg-[#1A0E04] px-4 py-3 text-sm text-[#F5ECD8] placeholder-[#5A3F22] outline-none focus:border-[#F28C28]/60 transition-colors"
          />
        </div>

        {submitError && (
          <p className="rounded-xl border border-[#E05050]/30 bg-[#E05050]/10 px-4 py-3 text-sm text-[#E05050]">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-xl bg-[#F28C28] px-6 py-4 font-bold text-[#0D0700] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {submitting ? 'Criando corrida...' : 'Criar corrida'}
        </button>
      </form>
    </div>
  )
}

