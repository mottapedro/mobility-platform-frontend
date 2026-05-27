'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import PasswordInput from '../../components/PasswordInput'
import { useAuth } from '../../contexts/AuthContext'
import type { AuthUser } from '../../types'
import type { OnboardingContext } from '../../types/network-v2'
import { redirectByRole } from '../../utils/redirectByRole'
import { Button, Input, Card, SectionTitle } from '../../design-system'
import { isInvalidReferralErrorMessage, normalizeReferralCode } from '../../utils/referral'

/** Formats a raw numeric string into Brazilian phone mask: (XX) XXXXX-XXXX or (XX) XXXX-XXXX */
function formatBrazilianPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** Extracts only digits from a formatted phone string */
function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

type RegisterPageClientProps = {
  referralSlug: string
  /**
   * Backend-governed onboarding context. When present, drives:
   *  - role lock (expectedActor)
   *  - invite badge label (invite.displayLabel)
   *  - referralCode submitted to /auth/register (invite.code)
   * When null, the user lands organically (or backend was unreachable);
   * referralSlug is still forwarded as referralCode for backward
   * compatibility with legacy links.
   */
  onboarding: OnboardingContext | null
}

export default function RegisterPageClient({ referralSlug, onboarding }: RegisterPageClientProps) {
  const router = useRouter()
  const { register } = useAuth()

  // Backend is the source of truth. The frontend NEVER infers flowType,
  // expectedActor, ownership or genealogy from the URL slug or storage.
  const normalizedSlug = normalizeReferralCode(referralSlug)
  const initialReferralCode = onboarding?.invite?.code ?? normalizedSlug

  // Allow runtime invalidation when the backend rejects the referral on
  // submit. We never read/write referral state from localStorage.
  const [referralCleared, setReferralCleared] = useState(false)
  const activeReferralCode = referralCleared ? '' : initialReferralCode
  const inviteLabel = referralCleared ? '' : onboarding?.invite?.displayLabel ?? ''
  const inviteActive = activeReferralCode.length > 0

  // When the backend governs the onboarding context, expectedActor locks
  // the role. Without context, we offer the organic toggle.
  const lockedRole: AuthUser['role'] | null = useMemo(() => {
    if (!onboarding || referralCleared) return null
    return onboarding.expectedActor === 'driver' ? 'driver' : 'passenger'
  }, [onboarding, referralCleared])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AuthUser['role']>(lockedRole ?? 'passenger')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [experienceLevel, setExperienceLevel] = useState('INICIANTE')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleCategory, setVehicleCategory] = useState('CONFORTO')
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [offerAssistedTransport, setOfferAssistedTransport] = useState(false)

  const effectiveRole: AuthUser['role'] = lockedRole ?? role

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const rawPhone = phoneDigits(phone)
    if (rawPhone.length < 10 || rawPhone.length > 11) {
      setError('Informe um telefone válido com DDD (10 ou 11 dígitos)')
      return
    }

    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres')
      return
    }

    if (effectiveRole === 'driver') {
      if (!vehicleModel.trim() || !vehicleBrand.trim() || !vehiclePlate.trim()) {
        setError('Preencha os dados do veículo')
        return
      }
      if (selectedRegions.length === 0) {
        setError('Selecione pelo menos uma região de atuação')
        return
      }
    }

    setLoading(true)
    try {
      const payload = {
        name,
        email,
        password,
        role: effectiveRole,
        phone: rawPhone,
        ...(effectiveRole === 'driver'
          ? {
              experienceLevel,
              vehicle: { model: vehicleModel, brand: vehicleBrand, plate: vehiclePlate, category: vehicleCategory },
              region: selectedRegions,
            }
          : {}),
        ...(activeReferralCode ? { referralCode: activeReferralCode } : {}),
      }
      await register(payload)

      if (effectiveRole === 'driver') {
        // Per-user UI preference; unrelated to network/referral graph.
        localStorage.setItem('aliado:assistedTransport', String(offerAssistedTransport))
      }

      router.push(redirectByRole(effectiveRole))
      // Force a server-component refresh so /driver or /passenger pick up
      // the freshly created network context on first paint.
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar'

      if (activeReferralCode && isInvalidReferralErrorMessage(message)) {
        setReferralCleared(true)
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0D0700] px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center mb-2">
          <img src="/logo-aliado.jpeg" alt="Logo Aliado" className="h-28 w-auto mb-2" />
          <SectionTitle className="text-center text-3xl mb-0">Aliado</SectionTitle>
        </div>
        <p className="text-center text-sm text-gray-200 mb-4">Criar conta</p>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {inviteActive && (
              <div
                className="rounded-2xl border border-[#F28C28]/25 bg-[#F28C28]/10 px-4 py-3 mb-2"
                data-testid="invite-banner"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F28C28]/75">
                  Convite ativo
                </p>
                <p className="mt-1 text-sm font-semibold text-orange-100">
                  {inviteLabel || 'Você chegou por um convite Aliado'}
                </p>
                {lockedRole && (
                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    Este convite cria uma conta de{' '}
                    <span className="font-semibold text-orange-200">
                      {lockedRole === 'driver' ? 'motorista' : 'passageiro'}
                    </span>
                    .
                  </p>
                )}
              </div>
            )}
            {!lockedRole && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Tipo de conta</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(['passenger', 'driver'] as const).map((entryRole) => (
                    <Button
                      key={entryRole}
                      type="button"
                      variant={role === entryRole ? 'primary' : 'secondary'}
                      fullWidth
                      onClick={() => setRole(entryRole)}
                    >
                      {entryRole === 'passenger' ? 'Passageiro' : 'Motorista'}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <Input
              label="Nome completo"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
            />
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
            <Input
              label="Telefone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={e => setPhone(formatBrazilianPhone(e.target.value))}
              placeholder="(11) 99999-9999"
            />
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Senha</label>
              <PasswordInput
                required
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1"
              />
            </div>
            {effectiveRole === 'driver' && (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Nível de experiência</label>
                  <select
                    value={experienceLevel}
                    onChange={e => setExperienceLevel(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500 scheme-dark mt-1"
                  >
                    {[['INICIANTE', 'Iniciante'], ['INTERMEDIARIO', 'Intermediário'], ['PROFISSIONAL', 'Profissional'], ['ELITE', 'Elite']].map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Regiões de atuação</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {[['ZN', 'Zona Norte'], ['ZS', 'Zona Sul'], ['ZO', 'Zona Oeste'], ['BAIXADA', 'Baixada'], ['INTER', 'Interior']].map(([value, label]) => (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          selectedRegions.includes(value)
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={selectedRegions.includes(value)}
                          onChange={() =>
                            setSelectedRegions((prev) =>
                              prev.includes(value) ? prev.filter((region) => region !== value) : [...prev, value]
                            )
                          }
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Veículo</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Input
                      type="text"
                      required
                      placeholder="Marca (ex: Toyota)"
                      value={vehicleBrand}
                      onChange={e => setVehicleBrand(e.target.value)}
                    />
                    <Input
                      type="text"
                      required
                      placeholder="Modelo (ex: Corolla)"
                      value={vehicleModel}
                      onChange={e => setVehicleModel(e.target.value)}
                    />
                    <Input
                      type="text"
                      required
                      placeholder="Placa (ex: ABC-1234)"
                      value={vehiclePlate}
                      onChange={e => setVehiclePlate(e.target.value.toUpperCase())}
                    />
                    <select
                      value={vehicleCategory}
                      onChange={e => setVehicleCategory(e.target.value)}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500 scheme-dark"
                    >
                      <option value="CONFORTO">Conforto</option>
                      <option value="EXECUTIVO">Executivo</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">Especialidades</label>
                  <button
                    type="button"
                    onClick={() => setOfferAssistedTransport((v) => !v)}
                    className={`mt-1 flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                      offerAssistedTransport
                        ? 'border-violet-500/40 bg-violet-500/8'
                        : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                    }`}
                  >
                    <span className="text-xl">♿</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${offerAssistedTransport ? 'text-violet-300' : 'text-white'}`}>
                        Transporte Assistido
                      </p>
                      <p className="text-xs text-zinc-400">Mobilidade reduzida, cadeirante e acompanhamento</p>
                    </div>
                    <div className={`h-5 w-5 rounded border transition-colors ${offerAssistedTransport ? 'border-violet-500 bg-violet-500' : 'border-zinc-600'} flex items-center justify-center`}>
                      {offerAssistedTransport && <span className="text-xs font-bold text-white">✓</span>}
                    </div>
                  </button>
                </div>
              </>
            )}
            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-gray-400">
          Já tem conta?{' '}
          <a href="/login" className="text-orange-400 hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  )
}

