'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { resetAllProgress } from '@/lib/progress'

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

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-black text-slate-800 dark:text-white mb-5">Settings</h1>

      {/* Theme */}
      <section className="mb-5">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Appearance</p>
        <div className="bg-white dark:bg-brand-slate rounded-2xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-sm text-slate-800 dark:text-white">Theme</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred appearance</p>
            </div>
          </div>
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                theme === 'light'
                  ? 'bg-brand-royal text-white border-transparent'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                theme === 'dark'
                  ? 'bg-brand-royal text-white border-transparent'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
              }`}
            >
              🌙 Dark
            </button>
          </div>
        </div>
      </section>

      {/* Progress */}
      <section className="mb-5">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Data</p>
        <div className="bg-white dark:bg-brand-slate rounded-2xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/40">
            <p className="font-semibold text-sm text-slate-800 dark:text-white">Reset Progress</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Clear all completed topics and progress data</p>
          </div>
          <div className="p-4">
            {resetDone ? (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Progress reset successfully</p>
            ) : showConfirm ? (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Are you sure? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold"
                  >
                    Yes, reset
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                Reset All Progress
              </button>
            )}
          </div>
        </div>
      </section>

      {/* App info */}
      <section>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">About</p>
        <div className="bg-white dark:bg-brand-slate rounded-2xl border border-slate-200/60 dark:border-slate-700/40 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center">
              <span className="text-white font-black">S</span>
            </div>
            <div>
              <p className="font-black text-slate-800 dark:text-white">StudyOS</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personal Learning Platform</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Built for Computer Science & AI at the University of Ibadan. 21 courses, fully written lesson content, and AI-powered quizzes.
          </p>
        </div>
      </section>
    </div>
  )
}
