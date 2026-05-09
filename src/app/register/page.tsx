'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PasswordInput from '../../components/PasswordInput'
import { useAuth } from '../../contexts/AuthContext'
import { redirectByRole } from '../../utils/redirectByRole'
import { getDrivers, type DriverSummary } from '../../services/drivers'
import type { AuthUser } from '../../types'

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

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<AuthUser['role']>('passenger')
  const [referrerDriverId, setReferrerDriverId] = useState('')
  const [drivers, setDrivers] = useState<DriverSummary[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Driver-specific fields
  const [experienceLevel, setExperienceLevel] = useState('INICIANTE')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleBrand, setVehicleBrand] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleCategory, setVehicleCategory] = useState('CONFORTO')
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])

  useEffect(() => {
    setLoadingDrivers(true)
    getDrivers()
      .then(setDrivers)
      .catch(() => setDrivers([]))
      .finally(() => setLoadingDrivers(false))
  }, [])

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

    if (role === 'driver') {
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
        role,
        phone: rawPhone,
        ...(role === 'driver'
          ? {
              experienceLevel,
              vehicle: { model: vehicleModel, brand: vehicleBrand, plate: vehiclePlate, category: vehicleCategory },
              region: selectedRegions,
            }
          : {}),
        ...(role === 'passenger' && referrerDriverId ? { referredByDriverId: referrerDriverId } : {}),
      }
      console.log('role enviado:', role)
      console.log('[register] payload:', payload)
      await register(payload)

      // Persist selected driver label for display on /passenger/create
      if (role === 'passenger' && referrerDriverId) {
        const selected = drivers.find((d) => d.id === referrerDriverId)
        if (selected) localStorage.setItem('aliado:referredDriver', JSON.stringify(selected))
      } else {
        localStorage.removeItem('aliado:referredDriver')
      }

      router.push(redirectByRole(role))
    } catch (err) {
      console.error('[register] error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Aliado</h1>
          <p className="mt-1 text-sm text-zinc-400">Criar conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Nome completo
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Telefone
            </label>
            <input
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(formatBrazilianPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Senha
            </label>
            <PasswordInput
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500"
            />
          </div>

          {/* Role selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Tipo de conta
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['passenger', 'driver'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    role === r
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {r === 'passenger' ? 'Passageiro' : 'Motorista'}
                </button>
              ))}
            </div>
          </div>

          {/* Driver-specific fields */}
          {role === 'driver' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Nível de experiência
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500 [color-scheme:dark]"
                >
                  {[['INICIANTE', 'Iniciante'], ['INTERMEDIARIO', 'Intermediário'], ['PROFISSIONAL', 'Profissional'], ['ELITE', 'Elite']].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Regiões de atuação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[['ZN', 'Zona Norte'], ['ZS', 'Zona Sul'], ['ZO', 'Zona Oeste'], ['BAIXADA', 'Baixada'], ['INTER', 'Interior']].map(([v, l]) => (
                    <label
                      key={v}
                      className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        selectedRegions.includes(v)
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedRegions.includes(v)}
                        onChange={() =>
                          setSelectedRegions((prev) =>
                            prev.includes(v) ? prev.filter((r) => r !== v) : [...prev, v]
                          )
                        }
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Veículo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Marca (ex: Toyota)"
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Modelo (ex: Corolla)"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Placa (ex: ABC-1234)"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500"
                  />
                  <select
                    value={vehicleCategory}
                    onChange={(e) => setVehicleCategory(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500 [color-scheme:dark]"
                  >
                    <option value="CONFORTO">Conforto</option>
                    <option value="EXECUTIVO">Executivo</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Referred driver — only for passengers */}
          {role === 'passenger' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Motorista aliado indicado
              </label>
              <select
                value={referrerDriverId}
                onChange={(e) => setReferrerDriverId(e.target.value)}
                disabled={loadingDrivers}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-orange-500 disabled:opacity-50 [color-scheme:dark]"
              >
                <option value="">
                  {loadingDrivers
                    ? 'Carregando motoristas...'
                    : 'Selecione seu motorista aliado (opcional)'}
                </option>
                {(drivers ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.phone ? ` · ${d.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500">
          Já tem conta?{' '}
          <a href="/login" className="text-orange-400 hover:underline">
            Entrar
          </a>
        </p>
      </div>
    </main>
  )
}
