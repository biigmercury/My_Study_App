'use client'

import { useState, useEffect } from 'react'
import { COURSES } from '@/lib/courses'
import { getProgress } from '@/lib/progress'
import type { CourseProgress } from '@/types'

// Ring progress SVG
function RingProgress({ value, total, size = 92, stroke = 9 }: { value: number; total: number; size?: number; stroke?: number }) {
  const pct = total > 0 ? value / total : 0
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke}
          className="stroke-brand-navy/[0.08] dark:stroke-brand-cyan/[0.12]" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          className="stroke-brand-royal dark:stroke-brand-sky"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold text-brand-navy dark:text-white leading-none"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif', fontSize: size * 0.28 }}
        >{Math.round(pct * 100)}</span>
        <span className="text-[9px] font-medium text-brand-navy/40 dark:text-white/35 tracking-[0.4px]">%</span>
      </div>
    </div>
  )
}

// Mini bar chart — 14 day activity
function ActivityChart({ topics }: { topics: number[] }) {
  const max = Math.max(...topics, 1)
  const total = topics.reduce((a, b) => a + b, 0)
  return (
    <div
      className="rounded-[20px] p-4 bg-white/80 dark:bg-brand-slate/60 border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
      style={{ boxShadow: '0 6px 24px -10px rgba(0,119,182,0.10)' }}
    >
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-[12px] font-bold text-brand-navy dark:text-white tracking-[0.2px]">Last 14 days</span>
        <span className="text-[11px] font-semibold text-brand-royal dark:text-brand-sky">{total} topics</span>
      </div>
      <div className="flex items-end gap-[5px] h-[60px]">
        {topics.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-[4px]"
            style={{
              height: `${(v / max) * 100}%`,
              minHeight: 4,
              background: v === 0
                ? 'rgba(3,4,94,0.06)'
                : `linear-gradient(180deg, #0077B6, #00B4D8)`,
              opacity: v === 0 ? 1 : (0.55 + (i / 14) * 0.45),
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] font-mono text-brand-navy/35 dark:text-white/25">
        <span>14d ago</span>
        <span>Today</span>
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({})
  const empty: CourseProgress = { completedTopics: [], lastVisited: '' }

  useEffect(() => {
    setProgressMap(getProgress())
  }, [])

  const totalTopics = COURSES.reduce((s, c) => s + c.topics.length, 0)
  const totalCompleted = Object.values(progressMap).reduce((s, p) => s + p.completedTopics.length, 0)

  // Static 14-day activity pattern (will be dynamic once activity log is built)
  const activity = [2, 3, 1, 0, 4, 2, 5, 3, 0, 2, 4, 3, 5, totalCompleted > 0 ? 2 : 0]

  return (
    <div className="pb-4">
      {/* Page title */}
      <div className="px-[22px] pt-2 pb-4">
        <h1
          className="text-[30px] font-semibold text-brand-navy dark:text-white tracking-[-0.7px]"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
        >
          Progress
        </h1>
        <p className="text-[13px] text-brand-navy/60 dark:text-white/50 mt-0.5">
          Your study journey across every course
        </p>
      </div>

      {/* Hero ring card */}
      <div className="px-4 pb-3.5">
        <div
          className="rounded-[20px] p-5 relative overflow-hidden bg-white/80 dark:bg-brand-slate/60 border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
          style={{ boxShadow: '0 6px 24px -10px rgba(0,119,182,0.14)' }}
        >
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              top: -40, right: -40, width: 160, height: 160,
              background: 'radial-gradient(circle, rgba(0,119,182,0.13), transparent 70%)',
            }}
          />
          <div className="flex gap-[18px] items-center relative">
            <RingProgress value={totalCompleted} total={totalTopics} size={92} stroke={9} />
            <div>
              <p className="text-[10px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
                Overall
              </p>
              <p
                className="text-[36px] font-semibold text-brand-navy dark:text-white leading-none tracking-[-1px] mt-0.5"
                style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
              >
                {totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0}
                <span className="text-[18px] opacity-50">%</span>
              </p>
              <p className="text-[12px] text-brand-navy/60 dark:text-white/50 mt-1">
                {totalCompleted} of {totalTopics} topics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity chart */}
      <div className="px-4 pb-3.5">
        <ActivityChart topics={activity} />
      </div>

      {/* Per-course breakdown */}
      <div className="px-[20px] mb-2.5">
        <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
          By course
        </span>
      </div>
      <div className="px-4 flex flex-col gap-2.5">
        {COURSES.map(course => {
          const p = progressMap[course.code] ?? empty
          const done = p.completedTopics.length
          const total = course.topics.length
          const ratio = total > 0 ? Math.round((done / total) * 100) : 0
          const pct = total > 0 ? (done / total) * 100 : 0
          return (
            <div
              key={course.code}
              className="rounded-[20px] p-3.5 bg-white/80 dark:bg-brand-slate/60 border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
              style={{ boxShadow: '0 6px 24px -10px rgba(0,119,182,0.08)' }}
            >
              <div className="flex gap-2.5 items-center mb-2">
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[17px] flex-shrink-0"
                  style={{ background: course.accent }}
                >
                  {course.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-brand-navy dark:text-white truncate">
                    {course.shortName}
                  </p>
                  <p className="text-[10.5px] font-mono text-brand-navy/40 dark:text-white/30">
                    {done}/{total} topics
                  </p>
                </div>
                <span
                  className="text-[19px] font-semibold text-brand-navy dark:text-white tracking-[-0.3px] tabular-nums"
                  style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
                >
                  {ratio}<span className="text-[11px] opacity-50">%</span>
                </span>
              </div>
              <div className="h-[6px] bg-brand-navy/[0.08] dark:bg-brand-cyan/[0.12] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: '#0077B6' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {totalCompleted === 0 && (
        <div className="text-center py-16 px-8">
          <p className="text-4xl mb-3">📚</p>
          <p
            className="text-[17px] font-semibold text-brand-navy dark:text-white"
            style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
          >
            No progress yet
          </p>
          <p className="text-[13px] text-brand-navy/50 dark:text-white/40 mt-1.5">
            Start studying to track your progress here
          </p>
        </div>
      )}
    </div>
  )
}
