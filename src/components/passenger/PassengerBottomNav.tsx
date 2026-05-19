'use client'

import { usePathname, useRouter } from 'next/navigation'

const TABS = [
  { label: 'Início', icon: '🏠', href: '/passenger' },
  { label: 'Viagens', icon: '📋', href: '/passenger/rides' },
  { label: '+', icon: null, href: '/passenger/create', featured: true },
  { label: 'Rede', icon: '🔗', href: '/passenger/network' },
  { label: 'Perfil', icon: '👤', href: '/passenger/profile' },
] as const

export function PassengerBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string): boolean {
    if (href === '/passenger') return pathname === '/passenger'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[#E6D2B3]/10 bg-[#1A120B] px-2 pb-safe pt-1">
      {TABS.map((tab) =>
        'featured' in tab && tab.featured ? (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className="flex flex-col items-center px-3 py-1 focus:outline-none"
            aria-label="Solicitar corrida"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F28C28] text-xl font-bold text-[#1E140F] shadow-[0_0_20px_rgba(242,140,40,0.5)] transition-transform active:scale-90">
              +
            </div>
          </button>
        ) : (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition-colors focus:outline-none ${
              isActive(tab.href) ? 'text-[#F28C28]' : 'text-[#E6D2B3]/40 hover:text-[#E6D2B3]/70'
            }`}
            aria-current={isActive(tab.href) ? 'page' : undefined}
          >
            <span className={`text-lg leading-none transition-transform ${isActive(tab.href) ? 'scale-110' : ''}`}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        ),
      )}
    </nav>
  )
}
