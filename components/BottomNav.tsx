'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import AnimatedNavIcon from '@/components/AnimatedNavIcon'

const tabs = [
  { href: '/', label: 'Home', name: 'home' },
  { href: '/courses', label: 'Courses', name: 'courses' },
  { href: '/progress', label: 'Progress', name: 'progress' },
  { href: '/search', label: 'Search', name: 'search' },
  { href: '/settings', label: 'Settings', name: 'settings' },
]

const ICON_SIZE = 28

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

  // Sized, invisible placeholder shown until the animated icon loads — keeps
  // the layout stable without flashing the old static icons.
  const placeholder = <span aria-hidden style={{ width: ICON_SIZE, height: ICON_SIZE, display: 'block' }} />

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
                  size={ICON_SIZE}
                  playToken={playTokens[tab.href] ?? 0}
                  fallback={placeholder}
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
