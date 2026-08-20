'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { searchAddresses, type AddressSuggestion } from '../../services/geocode'

export interface OperationalBaseSelection {
  formattedAddress: string
  providerPlaceId: string
}

interface OperationalBaseInputProps {
  value: OperationalBaseSelection | null
  onChange: (selection: OperationalBaseSelection | null) => void
  id?: string
  error?: string
}

const DEBOUNCE_MS = 350

/**
 * Campo de base operacional do motorista (origem M do pricing M→A).
 *
 * Usa o autocomplete Google existente (services/geocode.ts). Uma seleção
 * válida só existe quando o motorista escolhe uma sugestão do provider —
 * texto digitado manualmente sem `providerPlaceId` é tratado como inválido
 * e jamais enviado como base. Nenhuma lat/lng é emitida: o backend resolve
 * as coordenadas autoritativas via Google Place Details a partir do
 * providerPlaceId.
 */
export function OperationalBaseInput({
  value,
  onChange,
  id,
  error,
}: OperationalBaseInputProps) {
  const [text, setText] = useState(value?.formattedAddress ?? '')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selected, setSelected] = useState<OperationalBaseSelection | null>(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setText(value?.formattedAddress ?? '')
    setSelected(value)
  }, [value])

  const fetchSuggestions = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 4) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const results = await searchAddresses(trimmed)
      setSuggestions(results)
      setOpen(results.length > 0)
      setActiveIndex(-1)
    } catch (err) {
      console.error('[OperationalBaseInput] Erro ao buscar sugestões:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(text), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [text, fetchSuggestions])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleTextChange(next: string) {
    setText(next)
    setSelected(null)
    setOpen(false)
    onChange(null)
  }

  function selectSuggestion(s: AddressSuggestion) {
    if (!s.placeId) {
      setSuggestions([])
      setOpen(false)
      setSelected(null)
      onChange(null)
      return
    }
    const selection: OperationalBaseSelection = {
      formattedAddress: s.displayName,
      providerPlaceId: s.placeId,
    }
    setText(s.displayName)
    setSelected(selection)
    setOpen(false)
    setSuggestions([])
    setActiveIndex(-1)
    onChange(selection)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  function shortName(displayName: string) {
    const parts = displayName.split(',').map((p) => p.trim())
    return parts.slice(0, 3).join(', ')
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-widest text-gray-400"
      >
        Base de atendimento
      </label>
      <p className="text-xs leading-5 text-gray-400">
        Usaremos esta base quando sua localização atual não estiver disponível para
        calcular o deslocamento até o passageiro.
      </p>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          placeholder="Endereço/base de onde você normalmente inicia seus atendimentos"
          value={text}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? `${id ?? 'operational-base'}-listbox` : undefined}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 pr-9 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-orange-500 scheme-dark"
        />
        {loading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 animate-pulse">
            ⋯
          </span>
        )}
      </div>

      {selected && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px]">
            ✓
          </span>
          Endereço confirmado na lista de sugestões
        </p>
      )}

      {open && suggestions.length > 0 && (
        <ul
          id={`${id ?? 'operational-base'}-listbox`}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.placeId ?? i}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                selectSuggestion(s)
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-4 py-3 text-sm transition-colors ${
                i === activeIndex
                  ? 'bg-orange-500/15 text-white'
                  : 'text-zinc-300 hover:bg-orange-500/10 hover:text-white'
              } ${i > 0 ? 'border-t border-zinc-700/60' : ''}`}
            >
              <span className="mr-2 text-orange-400/60">📍</span>
              {shortName(s.displayName)}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
