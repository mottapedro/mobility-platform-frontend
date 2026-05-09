'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useRef, useState, type InputHTMLAttributes, type MouseEvent } from 'react'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export default function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
  }

  function handleToggle() {
    setShowPassword((current) => !current)
    inputRef.current?.focus({ preventScroll: true })
  }

  const toggleLabel = showPassword ? 'Ocultar senha' : 'Mostrar senha'

  return (
    <div className="relative">
      <input
        {...props}
        ref={inputRef}
        type={showPassword ? 'text' : 'password'}
        className={[className, 'pr-12'].filter(Boolean).join(' ')}
      />

      <button
        type="button"
        aria-label={toggleLabel}
        aria-pressed={showPassword}
        onMouseDown={handleMouseDown}
        onClick={handleToggle}
        className="absolute inset-y-0 right-0 flex min-w-11 cursor-pointer items-center justify-center px-3 text-zinc-400 transition-colors hover:text-zinc-200 focus:outline-none focus-visible:text-zinc-100"
      >
        {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  )
}