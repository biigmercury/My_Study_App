'use client'

import { useState, useEffect } from 'react'
import { COURSES, SEMESTER_1, SEMESTER_2 } from '@/lib/courses'
import { getProgress, getActivityLast14Days } from '@/lib/progress'
import type { CourseProgress } from '@/types'

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
          stroke="#00B4D8"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-semibold text-brand-navy dark:text-white leading-none"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif', fontSize: size * 0.28 }}>
          {Math.round(pct * 100)}
        </span>
        <span className="text-[9px] font-medium text-brand-navy/40 dark:text-white/35 tracking-[0.4px]">%</span>
      </div>
    </div>
  )
}

function ActivityChart({ topics }: { topics: number[] }) {
  const max = Math.max(...topics, 1)
  const total = topics.reduce((a, b) => a + b, 0)
  return (
    <div className="rounded-[20px] p-4 bg-white dark:bg-brand-surface border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
      style={{ boxShadow: 'var(--card-shadow)' }}>
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-[12px] font-bold text-brand-navy dark:text-white tracking-[0.2px]">Last 14 days</span>
        <span className="text-[11px] font-semibold text-brand-royal">{total} topic{total !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-end gap-[5px] h-[60px]">
        {topics.map((v, i) => (
          <div key={i} className="flex-1 rounded-[4px]"
            style={{
              height: `${(v / max) * 100}%`, minHeight: 4,
              background: v === 0 ? 'rgba(3,4,94,0.06)' : 'linear-gradient(180deg, #00B4D8, #90E0EF)',
              opacity: v === 0 ? 1 : (0.55 + (i / 14) * 0.45),
            }} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] font-mono text-brand-navy/35 dark:text-white/25">
        <span>14d ago</span><span>Today</span>
      </div>
    </div>
  )
}

function CourseProgressRow({ course, done, total }: { course: { code: string; shortName: string; icon: string; accent: string }; done: number; total: number }) {
  const ratio = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="rounded-[20px] p-3.5 bg-white dark:bg-brand-surface border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
      style={{ boxShadow: 'var(--card-shadow)' }}>
      <div className="flex gap-2.5 items-center mb-2">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[17px] flex-shrink-0"
          style={{ background: course.accent }}>{course.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-brand-navy dark:text-white truncate">{course.shortName}</p>
          <p className="text-[10.5px] font-mono text-brand-navy/40 dark:text-white/30">{done}/{total} topics</p>
        </div>
        <span className="text-[19px] font-semibold text-brand-navy dark:text-white tracking-[-0.3px] tabular-nums"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}>
          {ratio}<span className="text-[11px] opacity-50">%</span>
        </span>
      </div>
      <div className="h-[6px] bg-brand-navy/[0.08] dark:bg-brand-cyan/[0.12] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(done/total)*100}%`, background: '#00B4D8' }} />
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({})
  const [activity, setActivity] = useState<number[]>(new Array(14).fill(0))
  const empty: CourseProgress = { completedTopics: [], lastVisited: '' }

  useEffect(() => {
    setProgressMap(getProgress())
    setActivity(getActivityLast14Days())
  }, [])

  const totalTopics = COURSES.reduce((s, c) => s + c.topics.length, 0)
  const totalCompleted = Object.values(progressMap).reduce((s, p) => s + p.completedTopics.length, 0)

  return (
    <div className="pb-4">
      <div className="px-[22px] pt-2 pb-4">
        <h1 className="text-[30px] font-semibold text-brand-navy dark:text-white tracking-[-0.7px]"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}>
          Progress
        </h1>
        <p className="text-[13px] text-brand-navy/60 dark:text-white/50 mt-0.5">
          Your study journey across every course
        </p>
      </div>

      {/* Hero ring */}
      <div className="px-4 pb-3.5">
        <div className="rounded-[20px] p-5 relative overflow-hidden bg-white dark:bg-brand-surface border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
          style={{ boxShadow: 'var(--card-shadow)' }}>
          <div className="absolute rounded-full pointer-events-none"
            style={{ top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle, rgba(0,180,216,0.12), transparent 70%)' }} />
          <div className="flex gap-[18px] items-center relative">
            <RingProgress value={totalCompleted} total={totalTopics} size={92} stroke={9} />
            <div>
              <p className="text-[10px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">Overall</p>
              <p className="text-[36px] font-semibold text-brand-navy dark:text-white leading-none tracking-[-1px] mt-0.5"
                style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}>
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

      {/* Activity */}
      <div className="px-4 pb-3.5">
        <ActivityChart topics={activity} />
      </div>

      {/* Semester 1 */}
      <div className="px-[20px] mb-2.5 flex items-baseline gap-2">
        <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">Semester 1</span>
        <span className="text-[10px] font-mono text-brand-navy/25 dark:text-white/20">
          {SEMESTER_1.reduce((s, c) => s + (progressMap[c.code]?.completedTopics.length ?? 0), 0)}/
          {SEMESTER_1.reduce((s, c) => s + c.topics.length, 0)}
        </span>
      </div>
      <div className="px-4 flex flex-col gap-2.5 mb-4">
        {SEMESTER_1.map(course => {
          const p = progressMap[course.code] ?? empty
          return (
            <CourseProgressRow key={course.code} course={course}
              done={p.completedTopics.length} total={course.topics.length} />
          )
        })}
      </div>

      {/* Semester 2 */}
      <div className="px-[20px] mb-2.5 flex items-baseline gap-2">
        <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">Semester 2</span>
        <span className="text-[10px] font-mono text-brand-navy/25 dark:text-white/20">
          {SEMESTER_2.reduce((s, c) => s + (progressMap[c.code]?.completedTopics.length ?? 0), 0)}/
          {SEMESTER_2.reduce((s, c) => s + c.topics.length, 0)}
        </span>
      </div>
      <div className="px-4 flex flex-col gap-2.5">
        {SEMESTER_2.map(course => {
          const p = progressMap[course.code] ?? empty
          return (
            <CourseProgressRow key={course.code} course={course}
              done={p.completedTopics.length} total={course.topics.length} />
          )
        })}
      </div>

      {totalCompleted === 0 && (
        <div className="text-center py-16 px-8">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-[17px] font-semibold text-brand-navy dark:text-white"
            style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}>No progress yet</p>
          <p className="text-[13px] text-brand-navy/50 dark:text-white/40 mt-1.5">Start studying to track your progress here</p>
        </div>
      )}
    </div>
  )
}
