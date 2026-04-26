'use client'

type Props = {
  origin: string
  destination: string
}

export function RideRoutePreview({ origin, destination }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start gap-3">
        {/* Track */}
        <div className="flex flex-col items-center mt-1 shrink-0">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <div className="my-1 h-8 w-px bg-zinc-700" />
          <div className="h-2 w-2 rounded-full bg-red-500" />
        </div>

        {/* Labels */}
        <div className="flex flex-col gap-3 min-w-0">
          <div>
            <p className="text-xs text-zinc-500">Origem</p>
            <p className="text-sm font-medium text-white truncate">{origin}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Destino</p>
            <p className="text-sm font-medium text-white truncate">{destination}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
