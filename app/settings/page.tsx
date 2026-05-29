'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { resetAllProgress } from '@/lib/progress'
import {
  getSettings, saveSettings, requestNotificationPermission,
  scheduleReminder, cancelReminder, showNotification, registerServiceWorker, DEFAULTS,
  type AppSettings, type QuizDifficulty,
} from '@/lib/settings'

// ─── Reusable row ────────────────────────────────────────────────────────────

function SettingRow({
  icon, title, subtitle, right, last = false,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  right?: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 p-3.5 ${!last ? 'border-b border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]' : ''}`}>
      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 text-brand-royal"
        style={{ background: 'rgba(0,180,216,0.10)' }}>
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

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
      style={{ background: on ? '#00B4D8' : 'rgba(3,4,94,0.12)' }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? '22px' : '2px' }}
      />
    </button>
  )
}

const FEEDBACK_URL = 'https://wa.link/ogszop'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS)
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown')
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  useEffect(() => {
    setSettings(getSettings())
    if (typeof window !== 'undefined') {
      if (!('Notification' in window)) {
        setNotifStatus('unsupported')
      } else {
        setNotifStatus(Notification.permission as 'granted' | 'denied' | 'unknown')
      }
    }
  }, [])

  // ── helpers ──────────────────────────────────────────────────────────────

  function update(patch: Partial<AppSettings>) {
    const next = saveSettings(patch)
    setSettings(next)
    return next
  }

  async function toggleReminders() {
    if (settings.dailyReminders) {
      cancelReminder()
      update({ dailyReminders: false })
    } else {
      const granted = await requestNotificationPermission()
      if (!granted) {
        setNotifStatus('denied')
        return
      }
      setNotifStatus('granted')
      await registerServiceWorker()
      const next = update({ dailyReminders: true })
      scheduleReminder(next.reminderHour, next.reminderMinute)
      // Immediate confirmation so the user sees a real notification right away
      await showNotification(
        'Reminders on ✓',
        `You'll get a daily nudge at ${String(next.reminderHour).padStart(2, '0')}:${String(next.reminderMinute).padStart(2, '0')}.`,
      )
    }
  }

  function changeGoal(delta: number) {
    const next = Math.min(10, Math.max(1, settings.dailyGoal + delta))
    update({ dailyGoal: next })
  }

  function changeReminderHour(delta: number) {
    const next = (settings.reminderHour + delta + 24) % 24
    const saved = update({ reminderHour: next })
    if (saved.dailyReminders) scheduleReminder(saved.reminderHour, saved.reminderMinute)
  }

  function changeReminderMinute(delta: number) {
    const minutes = [0, 15, 30, 45]
    const idx = minutes.indexOf(settings.reminderMinute)
    const nextIdx = (idx + delta + minutes.length) % minutes.length
    const saved = update({ reminderMinute: minutes[nextIdx] })
    if (saved.dailyReminders) scheduleReminder(saved.reminderHour, saved.reminderMinute)
  }

  function setDifficulty(d: QuizDifficulty) {
    update({ quizDifficulty: d })
  }

  function handleReset() {
    resetAllProgress()
    setShowConfirm(false)
    setResetDone(true)
    setTimeout(() => setResetDone(false), 3000)
  }

  // ── shared card style ─────────────────────────────────────────────────────

  const card = 'rounded-[20px] overflow-hidden bg-white dark:bg-brand-surface border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]'

  return (
    <div className="pb-4">
      {/* Title */}
      <div className="px-[22px] pt-2 pb-[18px]">
        <h1 className="text-[30px] font-semibold text-brand-navy dark:text-white tracking-[-0.7px]"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}>
          Settings
        </h1>
      </div>

      {/* ── Appearance ──────────────────────────────────────────────────────── */}
      <SectionLabel>Appearance</SectionLabel>
      <div className="px-4 mb-4">
        <div className={card} style={{ boxShadow: 'var(--card-shadow)' }}>
          <div className="p-4">
            <p className="text-[14px] font-semibold text-brand-navy dark:text-white mb-0.5">Theme</p>
            <p className="text-[11.5px] text-brand-navy/55 dark:text-white/45 mb-3">Pick light or dark</p>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as const).map(mode => {
                const active = theme === mode
                return (
                  <button key={mode} onClick={() => setTheme(mode)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-[14px] text-[13px] font-semibold capitalize transition-all"
                    style={{
                      background: active ? '#00B4D8' : 'rgba(3,4,94,0.04)',
                      color: active ? '#fff' : undefined,
                      border: `1px solid ${active ? 'transparent' : 'rgba(3,4,94,0.08)'}`,
                    }}>
                    {mode === 'light'
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    }
                    {mode}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Study preferences ────────────────────────────────────────────────── */}
      <SectionLabel>Study preferences</SectionLabel>
      <div className="px-4 mb-4">
        <div className={card} style={{ boxShadow: 'var(--card-shadow)' }}>

          {/* Daily reminders */}
          <div className="border-b border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]">
            <SettingRow
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
              title="Daily reminders"
              subtitle={
                notifStatus === 'denied'
                  ? 'Blocked — allow notifications in browser settings'
                  : notifStatus === 'unsupported'
                    ? 'Not supported in this browser'
                    : settings.dailyReminders
                      ? `Every day at ${String(settings.reminderHour).padStart(2,'0')}:${String(settings.reminderMinute).padStart(2,'0')}`
                      : 'Tap to enable a daily study reminder'
              }
              right={
                notifStatus === 'unsupported' || notifStatus === 'denied'
                  ? <span className="text-[11px] text-brand-navy/35 dark:text-white/25">Unavailable</span>
                  : <Toggle on={settings.dailyReminders} onToggle={toggleReminders} />
              }
              last
            />
            {/* Inline time picker — visible when reminders are on */}
            {settings.dailyReminders && notifStatus === 'granted' && (
              <div className="px-3.5 pb-3.5 flex items-center gap-3">
                <div className="w-8 h-8 flex-shrink-0" /> {/* spacer to align with icon */}
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[12px] text-brand-navy/50 dark:text-white/40 font-medium w-[56px]">Remind at</span>
                  {/* Hour */}
                  <div className="flex items-center gap-1.5 bg-brand-navy/[0.04] dark:bg-brand-cyan/[0.06] rounded-xl px-2.5 py-1.5">
                    <button onClick={() => changeReminderHour(-1)}
                      className="text-brand-royal text-[16px] leading-none w-5 flex items-center justify-center">‹</button>
                    <span className="text-[14px] font-bold text-brand-navy dark:text-white tabular-nums w-7 text-center">
                      {String(settings.reminderHour).padStart(2, '0')}
                    </span>
                    <button onClick={() => changeReminderHour(+1)}
                      className="text-brand-royal text-[16px] leading-none w-5 flex items-center justify-center">›</button>
                  </div>
                  <span className="text-[16px] font-bold text-brand-navy/40 dark:text-white/30">:</span>
                  {/* Minute */}
                  <div className="flex items-center gap-1.5 bg-brand-navy/[0.04] dark:bg-brand-cyan/[0.06] rounded-xl px-2.5 py-1.5">
                    <button onClick={() => changeReminderMinute(-1)}
                      className="text-brand-royal text-[16px] leading-none w-5 flex items-center justify-center">‹</button>
                    <span className="text-[14px] font-bold text-brand-navy dark:text-white tabular-nums w-7 text-center">
                      {String(settings.reminderMinute).padStart(2, '0')}
                    </span>
                    <button onClick={() => changeReminderMinute(+1)}
                      className="text-brand-royal text-[16px] leading-none w-5 flex items-center justify-center">›</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Daily goal */}
          <SettingRow
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
            title="Daily goal"
            subtitle="Topics to complete each day"
            right={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeGoal(-1)}
                  disabled={settings.dailyGoal <= 1}
                  className="w-7 h-7 rounded-full text-[18px] font-semibold flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: 'rgba(0,180,216,0.10)', color: '#00B4D8' }}
                >−</button>
                <span className="text-[14px] font-bold text-brand-navy dark:text-white w-4 text-center tabular-nums">
                  {settings.dailyGoal}
                </span>
                <button
                  onClick={() => changeGoal(+1)}
                  disabled={settings.dailyGoal >= 10}
                  className="w-7 h-7 rounded-full text-[18px] font-semibold flex items-center justify-center transition-colors disabled:opacity-30"
                  style={{ background: 'rgba(0,180,216,0.10)', color: '#00B4D8' }}
                >+</button>
              </div>
            }
          />

          {/* Quiz difficulty */}
          <div className="p-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 text-brand-royal"
                style={{ background: 'rgba(0,180,216,0.10)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-brand-navy dark:text-white">Quiz difficulty</p>
                <p className="text-[11.5px] text-brand-navy/55 dark:text-white/45 mt-0.5">Default for new quizzes</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as QuizDifficulty[]).map(d => {
                const active = settings.quizDifficulty === d
                return (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold capitalize transition-all"
                    style={{
                      background: active ? '#00B4D8' : 'rgba(3,4,94,0.04)',
                      color: active ? '#fff' : undefined,
                      border: `1px solid ${active ? 'transparent' : 'rgba(3,4,94,0.08)'}`,
                    }}>
                    {d}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Data ────────────────────────────────────────────────────────────── */}
      <SectionLabel>Data</SectionLabel>
      <div className="px-4 mb-4">
        <div className={card} style={{ boxShadow: 'var(--card-shadow)' }}>
          {/* Give feedback */}
          <div className="p-3.5 border-b border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.0c-.24.68-1.42 1.31-1.95 1.36-.5.05-.98.24-3.3-.69-2.77-1.09-4.55-3.91-4.69-4.09-.14-.18-1.13-1.5-1.13-2.86s.71-2.03.96-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.55.81 1.91.88 2.05.07.14.12.3.02.48-.09.18-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.18-.21.69-.81.87-1.09.18-.28.37-.23.62-.14.25.09 1.6.76 1.88.9.28.14.46.21.53.32.07.12.07.66-.17 1.34z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-brand-navy dark:text-white">Give feedback</p>
                <p className="text-[11.5px] text-brand-navy/55 dark:text-white/45 mt-0.5">Report bugs or suggest features on WhatsApp</p>
              </div>
            </div>
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: 'rgba(37,211,102,0.12)', color: '#1ca452', border: '1px solid rgba(37,211,102,0.30)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2z"/></svg>
              Send feedback
            </a>
          </div>

          {/* Reset progress */}
          <div className="p-3.5">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-brand-navy dark:text-white">Reset progress</p>
                <p className="text-[11.5px] text-brand-navy/55 dark:text-white/45 mt-0.5">Clear all completed topics</p>
              </div>
            </div>
            {resetDone ? (
              <p className="text-[13px] text-green-600 dark:text-green-400 font-medium">✓ Progress reset successfully</p>
            ) : showConfirm ? (
              <div>
                <p className="text-[12px] text-brand-navy/60 dark:text-white/50 mb-2.5">
                  This will clear every completed topic. Cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[13px] font-bold">Yes, reset</button>
                  <button onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-brand-navy dark:text-white border border-brand-navy/[0.08] dark:border-brand-cyan/[0.12]"
                    style={{ background: 'rgba(255,255,255,0.6)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowConfirm(true)}
                className="w-full py-[11px] rounded-xl text-[13px] font-semibold text-red-500"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}>
                Reset all progress
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── About ────────────────────────────────────────────────────────────── */}
      <SectionLabel>About</SectionLabel>
      <div className="px-4">
        <div className={card} style={{ boxShadow: 'var(--card-shadow)' }}>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2.5">
              <img src="/logo.jpg" alt="StudyOS" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-[20px] mb-2">
      <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
        {children}
      </span>
    </div>
  )
}
