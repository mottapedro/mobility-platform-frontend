'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { getNotificationPermission, requestNotificationPermission } from '../services/notifications'

export function NotificationConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const perm = getNotificationPermission()
    if (perm === 'default') {
      // Delay slightly so it doesn't fight for attention on first render
      const t = setTimeout(() => setVisible(true), 2500)
      return () => clearTimeout(t)
    }
  }, [])

  if (!visible) return null

  async function handleAllow() {
    const result = await requestNotificationPermission()
    if (result === 'granted') {
      // saveFcmToken would be called here with actual user id
    }
    setVisible(false)
  }

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md animate-[slideUp_0.3s_ease-out] rounded-2xl border border-[#F28C28]/30 bg-[#2B1E15] p-4 shadow-2xl"
      role="dialog"
      aria-label="Ativar notificações"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F28C28]/15">
          <Bell size={18} className="text-[#F28C28]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#E6D2B3]">Ativar notificações</p>
          <p className="mt-0.5 text-xs text-[#E6D2B3]/60">
            Receba alertas de corridas e atualizações em tempo real.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAllow}
              className="rounded-lg bg-[#F28C28] px-4 py-1.5 text-xs font-bold text-[#1E140F] transition-opacity hover:opacity-90"
            >
              Ativar
            </button>
            <button
              onClick={() => setVisible(false)}
              className="rounded-lg border border-[#E6D2B3]/15 px-4 py-1.5 text-xs font-semibold text-[#E6D2B3]/50 transition-colors hover:text-[#E6D2B3]"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Fechar"
          className="mt-0.5 text-[#E6D2B3]/30 transition-colors hover:text-[#E6D2B3]"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
