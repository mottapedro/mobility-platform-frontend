'use client'

import type { AlliedDriverCardData } from '../../hooks/useAlliedDriver'

interface AlliedDriverCardProps {
  driver: AlliedDriverCardData | null
  loading: boolean
  error: boolean
  onRequestRide: () => void
}

export function AlliedDriverCard({ driver, loading, error, onRequestRide }: AlliedDriverCardProps) {
  return (
    <section className="rounded-[1.75rem] border border-[#F28C28]/20 bg-[linear-gradient(180deg,rgba(242,140,40,0.12),rgba(43,30,21,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition-transform duration-200 hover:scale-[1.005]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F28C28]/75">
            Meu motorista aliado
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#F5ECD8]">Seu motorista pessoal no app</h2>
          <p className="mt-1.5 text-sm leading-6 text-[#F5ECD8]/65">
            Relação persistente para gerar confiança, prioridade e uma experiência mais próxima.
          </p>
        </div>
        {driver && (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#F28C28]/30 bg-[#F28C28]/15 text-lg font-bold text-[#FAD2A4]">
            {driver.avatarLabel}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && !driver && (
        <div className="mt-5 animate-pulse rounded-2xl border border-[#2E1A08] bg-[#1A0E04]/80 p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[#2E1A08]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-[#2E1A08]" />
              <div className="h-2 w-48 rounded bg-[#2E1A08]" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-[#2E1A08]" />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-2xl border border-[#E05050]/25 bg-[#E05050]/10 p-4 text-sm text-[#E05050]">
          Não foi possível carregar seu motorista aliado agora.
        </div>
      )}

      {/* Driver card */}
      {driver && (
        <div className="mt-5 rounded-[1.5rem] border border-[#F28C28]/20 bg-[#1A0E04]/92 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F28C28] text-sm font-bold text-[#0D0700]">
              {driver.avatarLabel}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-[#F5ECD8]">{driver.name}</p>
              <p className="truncate text-xs text-[#F5ECD8]/45">{driver.headline}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'VEÍCULO', value: driver.vehicleLabel },
              { label: 'REGIÃO', value: driver.regionLabel },
              { label: 'NOTA', value: driver.ratingLabel },
              { label: 'CONTATO', value: driver.phoneLabel },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-[#2E1A08] bg-black/10 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F28C28]/70">
                  {label}
                </p>
                <p className="mt-2 text-sm font-medium text-[#F5ECD8]">{value}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onRequestRide}
            className="mt-4 w-full rounded-2xl bg-[#F28C28] px-4 py-3 text-sm font-bold text-[#0D0700] transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Solicitar corrida
          </button>
        </div>
      )}

      {/* Empty — no driver */}
      {!loading && !driver && !error && (
        <div className="mt-5 rounded-[1.5rem] border border-[#2E1A08] bg-[#1A0E04]/92 p-4">
          <p className="text-base font-semibold text-[#F5ECD8]">Nenhum motorista aliado vinculado</p>
          <p className="mt-2 text-sm leading-6 text-[#F5ECD8]/55">
            Quando você se cadastra por indicação, o vínculo fica salvo aqui para prioridade nas
            próximas corridas.
          </p>
          <button
            onClick={onRequestRide}
            className="mt-4 w-full rounded-2xl border border-[#F28C28]/30 px-4 py-3 text-sm font-semibold text-[#F28C28] transition-colors hover:border-[#F28C28] hover:bg-[#F28C28]/10 active:scale-[0.98]"
          >
            Solicitar corrida mesmo assim
          </button>
        </div>
      )}
    </section>
  )
}
