'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Calendar, Users, Network, Wallet, User } from 'lucide-react'

const tabs = [
  { href: '/driver/offers',             label: 'Ofertas',    Icon: Car     },
  { href: '/driver/rides',              label: 'Corridas',   Icon: Calendar },
  { href: '/driver/network?tab=passengers', label: 'Clientes',  Icon: Users   },
  { href: '/driver/network?tab=drivers',    label: 'Rede',      Icon: Network },
  { href: '/driver/ganhos',             label: 'Ganhos',     Icon: Wallet  },
  { href: '/driver/profile',            label: 'Perfil',     Icon: User    },
]

export function DriverBottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    const base = href.split('?')[0]
    return pathname === base || pathname.startsWith(base + '/')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#2E1A08] bg-[#0D0700]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ href, label, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                active ? 'text-[#F28C28]' : 'text-[#9A7D5A] hover:text-[#F5ECD8]/70'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
