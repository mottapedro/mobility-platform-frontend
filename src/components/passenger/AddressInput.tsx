'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { searchAddresses, getPlaceDetails, geocodeAddress, type AddressSuggestion } from '../../services/geocode'

export interface AddressCoords {
  lat: number
  lng: number
}

interface AddressInputProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string, coords?: AddressCoords) => void
  id?: string
  required?: boolean
}

const DEBOUNCE_MS = 350

export function AddressInput({
  label,
  placeholder,
  value,
  onChange,
  id,
  required,
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 4) {
      console.log('[AddressInput] Query muito curta, abortando:', trimmed)
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const results = await searchAddresses(trimmed)
      console.log('[AddressInput] Resultados recebidos:', results)
      setSuggestions(results)
      setOpen(results.length > 0)
      setActiveIndex(-1)
    } catch (err) {
      console.error('[AddressInput] Erro ao buscar sugestões:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    console.log('[AddressInput] value mudou, agendando fetch para:', value)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, fetchSuggestions])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function selectSuggestion(s: AddressSuggestion) {
    console.log('Suggestion clicada:', s)
    const displayName = s.displayName

    let coords: AddressCoords | undefined
    if (s.lat != null && s.lng != null) {
      coords = { lat: s.lat, lng: s.lng }
    } else if (s.placeId) {
      try {
        const details = await getPlaceDetails(s.placeId)
        if (details?.lat != null && details?.lng != null) {
          coords = { lat: details.lat, lng: details.lng }
        }
      } catch (err) {
        console.error('[AddressInput] Falha ao obter detalhes do lugar:', err)
      }
    }

    if (!coords) {
      try {
        const geocoded = await geocodeAddress(displayName)
        if (geocoded) coords = geocoded
      } catch {}
    }

    if (!coords) {
      console.warn('[AddressInput] Não foi possível obter coordenadas para:', displayName)
      onChange(displayName, undefined)
    } else {
      console.log('[AddressInput] Coordenadas extraídas:', coords)
      onChange(displayName, coords)
    }

    setOpen(false)
    setSuggestions([])
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    console.log('[AddressInput] key down:', e.key, 'open:', open, 'suggestions:', suggestions.length)
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

  // Shorten display_name for readability: keep first two comma-separated parts
  function shortName(displayName: string) {
    const parts = displayName.split(',').map((p) => p.trim())
    return parts.slice(0, 3).join(', ')
  }

  console.log('[AddressInput] render:', { value, open, suggestionsCount: suggestions.length, loading })

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[#F5ECD8]/70">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          placeholder={placeholder}
          value={value}
          required={required}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? `${id ?? 'address'}-listbox` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          className="w-full rounded-xl border border-[#2E1A08] bg-[#1A0E04] px-4 py-3 pr-9 text-sm text-[#F5ECD8] placeholder-[#5A3F22] outline-none focus:border-[#F28C28]/60 transition-colors"
        />
        {loading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9A7D5A] text-xs animate-pulse">
            ⋯
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={`${id ?? 'address'}-listbox`}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-[#2E1A08] bg-[#140A02] shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lng}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault()
                selectSuggestion(s)
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-4 py-3 text-sm transition-colors ${
                i === activeIndex
                  ? 'bg-[#F28C28]/15 text-[#F5ECD8]'
                  : 'text-[#C4A47C] hover:bg-[#F28C28]/8 hover:text-[#F5ECD8]'
              } ${i > 0 ? 'border-t border-[#2E1A08]' : ''}`}
            >
              <span className="mr-2 text-[#F28C28]/60">📍</span>
              {shortName(s.displayName)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
