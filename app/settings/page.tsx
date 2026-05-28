'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { resetAllProgress } from '@/lib/progress'

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  last = false,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  right?: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3.5 ${!last ? 'border-b border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]' : ''}`}
    >
      <div
        className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 text-brand-royal dark:text-brand-sky"
        style={{ background: 'rgba(0,180,216,0.10)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-brand-navy dark:text-white">{title}</p>
        {subtitle && <p className="text-[11.5px] text-brand-navy/55 dark:text-white/45 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const handleReset = () => {
    resetAllProgress()
    setShowConfirm(false)
    setResetDone(true)
    setTimeout(() => setResetDone(false), 3000)
  }

  const card = 'rounded-[20px] overflow-hidden bg-white/80 dark:bg-brand-slate/60 border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]'
  const cardShadow = { boxShadow: '0 6px 24px -10px rgba(0,119,182,0.10)' }

  return (
    <div className="pb-4">
      {/* Title */}
      <div className="px-[22px] pt-2 pb-[18px]">
        <h1
          className="text-[30px] font-semibold text-brand-navy dark:text-white tracking-[-0.7px]"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
        >
          Settings
        </h1>
      </div>

      {/* Appearance */}
      <div className="px-[20px] mb-2">
        <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
          Appearance
        </span>
      </div>
      <div className="px-4 mb-4">
        <div className={card} style={cardShadow}>
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[14px] font-semibold text-brand-navy dark:text-white">Theme</p>
                <p className="text-[11.5px] text-brand-navy/55 dark:text-white/45 mt-0.5">Pick light or dark</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map(mode => {
                const active = theme === mode
                return (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-[13px] font-semibold capitalize transition-all"
                    style={{
                      background: active ? '#0077B6' : 'rgba(3,4,94,0.04)',
                      color: active ? '#fff' : undefined,
                      border: `1px solid ${active ? 'transparent' : 'rgba(3,4,94,0.08)'}`,
                    }}
                  >
                    {mode === 'light' ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/>
                        <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                        <line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/>
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                      </svg>
                    )}
                    {mode}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Study preferences */}
      <div className="px-[20px] mb-2">
        <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
          Study preferences
        </span>
      </div>
      <div className="px-4 mb-4">
        <div className={card} style={cardShadow}>
          <SettingRow
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
            title="Daily reminders"
            subtitle="Every day at 8:00 PM"
            right={
              <div className="w-10 h-6 rounded-full flex items-center justify-end pr-0.5" style={{ background: '#0077B6' }}>
                <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </div>
            }
          />
          <SettingRow
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
            title="Daily goal"
            subtitle="1 topic per day"
            right={<span className="text-[13px] text-brand-navy/50 dark:text-white/40">1 topic</span>}
          />
          <SettingRow
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
            title="Quiz difficulty"
            subtitle="Medium by default"
            right={<span className="text-[13px] text-brand-navy/50 dark:text-white/40">Medium</span>}
            last
          />
        </div>
      </div>

      {/* Data */}
      <div className="px-[20px] mb-2">
        <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
          Data
        </span>
      </div>
      <div className="px-4 mb-4">
        <div className={card} style={cardShadow}>
          <SettingRow
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
            title="Download for offline"
            subtitle="2.4 MB of lessons"
          />
          <div className="p-4 border-t border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]">
            {resetDone ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Progress reset successfully
              </p>
            ) : showConfirm ? (
              <div>
                <p className="text-[12px] text-brand-navy/60 dark:text-white/50 mb-3">
                  This will clear every completed topic. Cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold"
                  >
                    Yes, reset
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-brand-navy dark:text-white border border-brand-navy/[0.08] dark:border-brand-cyan/[0.12]"
                    style={{ background: 'rgba(255,255,255,0.6)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-[11px] rounded-xl text-[13px] font-semibold text-red-500"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.20)',
                }}
              >
                Reset all progress
              </button>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      <div className="px-[20px] mb-2">
        <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
          About
        </span>
      </div>
      <div className="px-4">
        <div className={card} style={cardShadow}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2.5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[22px] font-semibold flex-shrink-0"
                style={{
                  fontFamily: '"New York", ui-serif, Georgia, serif',
                  background: 'linear-gradient(135deg, #03045E, #00B4D8)',
                }}
              >
                S
              </div>
              <div>
                <p className="text-[15px] font-bold text-brand-navy dark:text-white">StudyOS</p>
                <p className="text-[11px] text-brand-navy/45 dark:text-white/35">v 0.1.0 · Personal Learning</p>
              </div>
            </div>
            <p className="text-[12.5px] text-brand-navy/60 dark:text-white/50 leading-[1.5]">
              Built for Computer Science &amp; AI at University of Ibadan. 21 courses, fully written lessons, AI-powered quizzes.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
