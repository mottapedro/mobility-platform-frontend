'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getDriverOperationalBase,
  updateDriverOperationalBase,
  type DriverOperationalBase,
} from '../../services/drivers'
import {
  OperationalBaseInput,
  type OperationalBaseSelection,
} from './OperationalBaseInput'

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'no_base' }
  | { status: 'configured'; base: DriverOperationalBase }
  | { status: 'editing'; base: DriverOperationalBase | null }
  | { status: 'saving' }

/**
 * Seção "Base de atendimento" do perfil do motorista (self-service, Fase E).
 *
 * Estados:
 *   loading    → GET /drivers/me/operational-base em voo
 *   error      → falha de leitura (com "Tentar novamente")
 *   no_base    → sem base cadastrada + CTA "Configurar"
 *   configured → base exibida + CTA "Editar"
 *   editing    → OperationalBaseInput + Salvar/Cancelar
 *   saving     → PUT em voo (botão desabilitado) → sucesso volta a configured
 *
 * A gravação envia APENAS formattedAddress + providerPlaceId. Lat/lng são
 * resolvidos no backend (Decision B) e nunca trafegam pelo cliente.
 */
export function OperationalBaseSection() {
  const [ui, setUi] = useState<UiState>({ status: 'loading' })
  const [selection, setSelection] = useState<OperationalBaseSelection | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [updatedFlash, setUpdatedFlash] = useState(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    setUi({ status: 'loading' })
    setSaveError(null)
    try {
      const base = await getDriverOperationalBase()
      setUi(base ? { status: 'configured', base } : { status: 'no_base' })
    } catch (err) {
      setUi({
        status: 'error',
        message: err instanceof Error ? err.message : 'Erro ao carregar a base de atendimento',
      })
    }
  }, [])

  useEffect(() => {
    void load()
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    }
  }, [load])

  function startEdit(base: DriverOperationalBase | null) {
    setSelection(
      base
        ? {
            formattedAddress: base.formattedAddress,
            providerPlaceId: base.providerPlaceId ?? '',
          }
        : null,
    )
    setSaveError(null)
    setUi({ status: 'editing', base })
  }

  function cancelEdit() {
    setSaveError(null)
    setUi((current) =>
      current.status === 'editing' && current.base
        ? { status: 'configured', base: current.base }
        : { status: 'no_base' },
    )
  }

  async function handleSave() {
    if (!selection || !selection.providerPlaceId) return

    const previousBase = ui.status === 'editing' ? ui.base : null
    setUi({ status: 'saving' })
    setSaveError(null)
    try {
      const saved = await updateDriverOperationalBase({
        formattedAddress: selection.formattedAddress,
        providerPlaceId: selection.providerPlaceId,
      })
      setUpdatedFlash(true)
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setUpdatedFlash(false), 4000)
      setUi({ status: 'configured', base: saved })
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar a base de atendimento')
      setUi({ status: 'editing', base: previousBase })
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#2E1A08] bg-[#1A0E04] p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#9A7D5A]">
        Base de atendimento
      </p>

      {ui.status === 'loading' && (
        <p className="animate-pulse text-xs text-[#5A3F22]" role="status">
          Carregando base de atendimento…
        </p>
      )}

      {ui.status === 'error' && (
        <div className="flex flex-col gap-3" role="alert">
          <p className="text-xs text-red-400">{ui.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="self-start rounded-lg border border-[#F28C28]/40 px-4 py-2 text-xs font-semibold text-[#F28C28] transition-colors hover:bg-[#F28C28]/10"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {ui.status === 'no_base' && (
        <div className="flex flex-col gap-3">
          <p className="text-xs leading-5 text-[#9A7D5A]">
            Você ainda não cadastrou a base de onde normalmente inicia os atendimentos. Sem
            ela, corridas agendadas não conseguem calcular o deslocamento até o passageiro.
          </p>
          <button
            type="button"
            onClick={() => startEdit(null)}
            className="self-start rounded-lg bg-[#F28C28] px-4 py-2 text-xs font-bold text-[#0D0700] transition-colors hover:bg-[#F28C28]/90"
          >
            Configurar base
          </button>
        </div>
      )}

      {ui.status === 'configured' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[#F5ECD8]">
                {ui.base.formattedAddress}
              </span>
              <span className="text-[11px] text-[#5A3F22]">
                Atualizada em{' '}
                {new Date(ui.base.updatedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => startEdit(ui.base)}
              className="shrink-0 rounded-lg border border-[#F28C28]/40 px-3 py-2 text-xs font-semibold text-[#F28C28] transition-colors hover:bg-[#F28C28]/10"
            >
              Editar
            </button>
          </div>
          {updatedFlash && (
            <p className="text-xs font-medium text-emerald-400" role="status">
              ✓ Base de atendimento atualizada
            </p>
          )}
        </div>
      )}

      {ui.status === 'editing' && (
        <div className="flex flex-col gap-3">
          <OperationalBaseInput
            id="profile-operational-base"
            value={selection}
            onChange={setSelection}
            error={saveError ?? undefined}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!selection || !selection.providerPlaceId}
              className="flex-1 rounded-lg bg-[#F28C28] px-4 py-2.5 text-xs font-bold text-[#0D0700] transition-colors hover:bg-[#F28C28]/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Salvar base
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="flex-1 rounded-lg border border-[#2E1A08] px-4 py-2.5 text-xs font-semibold text-[#9A7D5A] transition-colors hover:bg-[#F28C28]/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {ui.status === 'saving' && (
        <p className="animate-pulse text-xs text-[#F28C28]" role="status">
          Salvando base de atendimento…
        </p>
      )}
    </div>
  )
}