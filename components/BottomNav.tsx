'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import AnimatedNavIcon from '@/components/AnimatedNavIcon'

const tabs = [
  {
    href: '/',
    label: 'Home',
    name: 'home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/courses',
    label: 'Courses',
    name: 'courses',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    href: '/progress',
    label: 'Progress',
    name: 'progress',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/search',
    label: 'Search',
    name: 'search',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    name: 'settings',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // Per-tab counter; bumping it tells AnimatedNavIcon to replay (hover / tap).
  const [playTokens, setPlayTokens] = useState<Record<string, number>>({})

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const triggerPlay = (href: string) =>
    setPlayTokens(t => ({ ...t, [href]: (t[href] ?? 0) + 1 }))

  const pillBg     = isDark ? 'rgba(8,12,50,0.75)'        : 'rgba(255,255,255,0.88)'
  const pillBorder = isDark ? 'rgba(144,224,239,0.12)'     : 'rgba(3,4,94,0.07)'
  const pillShadow = isDark
    ? '0 10px 30px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,180,216,0.05) inset'
    : '0 10px 30px -12px rgba(3,4,94,0.18), 0 0 0 1px rgba(255,255,255,0.7) inset'
  const activeColor   = '#00B4D8'
  const inactiveColor = isDark ? 'rgba(202,240,248,0.40)' : 'rgba(3,4,94,0.35)'
  // Hex equivalents for the Lottie colorize (which needs a solid colour).
  const iconActive   = '#00B4D8'
  const iconInactive = isDark ? '#7E8BB6' : '#9398AC'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-[430px] pointer-events-none px-3.5 pb-5">
        <div
          className="pointer-events-auto flex justify-between p-2 rounded-[28px]"
          style={{
            background: pillBg,
            backdropFilter: 'blur(22px) saturate(180%)',
            WebkitBackdropFilter: 'blur(22px) saturate(180%)',
            border: `1px solid ${pillBorder}`,
            boxShadow: pillShadow,
          }}
        >
          {tabs.map(tab => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onMouseEnter={() => triggerPlay(tab.href)}
                onClick={() => triggerPlay(tab.href)}
                className="flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-[18px] transition-colors"
                style={{ color: active ? activeColor : inactiveColor }}
              >
                <AnimatedNavIcon
                  name={tab.name}
                  active={active}
                  color={active ? iconActive : iconInactive}
                  size={28}
                  playToken={playTokens[tab.href] ?? 0}
                  fallback={tab.icon(active)}
                />
                <span className={`text-[10px] tracking-[0.1px] ${active ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
