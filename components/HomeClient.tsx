'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getProgress, getOverallStats } from '@/lib/progress'
import { getTotalTopicCount } from '@/lib/courses'
import type { Course, CourseProgress } from '@/types'

interface HomeClientProps {
  courses: Course[]
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// SVG ring progress component
function RingProgress({ value, total, size = 76 }: { value: number; total: number; size?: number }) {
  const stroke = 7
  const pct = total > 0 ? value / total : 0
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)
  const pctInt = Math.round(pct * 100)

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke}
          className="stroke-brand-navy/[0.08] dark:stroke-brand-cyan/[0.12]"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke} strokeLinecap="round"
          className="stroke-brand-royal dark:stroke-brand-sky"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-brand-navy dark:text-white font-semibold leading-none"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif', fontSize: size * 0.28 }}
        >{pctInt}</span>
        <span className="text-[9px] text-brand-navy/50 dark:text-white/40 font-medium tracking-[0.4px]">%</span>
      </div>
    </div>
  )
}

export default function HomeClient({ courses }: HomeClientProps) {
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({})
  const [stats, setStats] = useState({ completedTopics: 0, totalTopics: 0, activeStreak: 0, lastCourseCode: null as string | null })

  useEffect(() => {
    const all = getProgress()
    setProgressMap(all)
    setStats(getOverallStats(getTotalTopicCount()))
  }, [])

  const today = new Date()
  const todayStr = today.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })
  const todayIdx = (today.getDay() + 6) % 7 // Mon=0 … Sun=6

  // Week strip — highlight today; mark studied days (static pattern for demo, replaced by real data when streak logic improves)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const studied = days.map((_, i) => i < todayIdx && stats.activeStreak > (todayIdx - i - 1))

  const lastCourse = stats.lastCourseCode ? courses.find(c => c.code === stats.lastCourseCode) : null
  const totalTopics = stats.totalTopics || courses.reduce((s, c) => s + c.topics.length, 0)
  const empty: CourseProgress = { completedTopics: [], lastVisited: '' }

  return (
    <div className="pt-2 pb-4">
      {/* Hero greeting */}
      <div className="px-[22px] pb-[18px]">
        <p className="text-sm font-medium text-brand-navy/60 dark:text-white/60 mb-0.5 tracking-[-0.1px]">
          {getGreeting()},
        </p>
        <h1
          className="text-[34px] font-semibold text-brand-navy dark:text-white leading-[1.05] tracking-[-0.8px]"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
        >
          Scholar.
        </h1>
        <div className="flex items-center gap-1.5 mt-1.5 text-[13px] text-brand-navy/45 dark:text-white/40">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>{todayStr}</span>
        </div>
      </div>

      {/* Today's focus card — ring + week strip */}
      <div className="px-4 pb-3.5">
        <div
          className="rounded-[20px] overflow-hidden border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
          style={{ boxShadow: '0 6px 24px -10px rgba(0,119,182,0.18)' }}
        >
          {/* Ring + next topic */}
          <div
            className="p-[18px] flex gap-4 items-center"
            style={{
              background: 'linear-gradient(135deg, rgba(202,240,248,0.6), rgba(144,224,239,0.3) 60%, transparent)',
            }}
          >
            <div className="dark:hidden">
              <RingProgress value={stats.completedTopics} total={totalTopics} size={76} />
            </div>
            <div className="hidden dark:block">
              <RingProgress value={stats.completedTopics} total={totalTopics} size={76} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-[0.8px] uppercase text-brand-navy/50 dark:text-white/40 mb-0.5">
                Today&apos;s focus
              </p>
              {lastCourse ? (
                <>
                  <p
                    className="text-[17px] font-semibold text-brand-navy dark:text-white leading-[1.2]"
                    style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
                  >
                    {lastCourse.shortName}
                  </p>
                  <p className="text-[12px] text-brand-navy/60 dark:text-white/50 mt-0.5">
                    {(progressMap[lastCourse.code]?.completedTopics.length ?? 0)}/{lastCourse.topics.length} topics complete
                  </p>
                  <Link
                    href={`/courses/${lastCourse.code}`}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold text-white"
                    style={{
                      background: '#0077B6',
                      boxShadow: '0 4px 14px -4px #0077B688',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Continue
                  </Link>
                </>
              ) : (
                <>
                  <p
                    className="text-[17px] font-semibold text-brand-navy dark:text-white leading-[1.2]"
                    style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
                  >
                    Start studying
                  </p>
                  <p className="text-[12px] text-brand-navy/60 dark:text-white/50 mt-0.5">
                    Pick a course below
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Week strip */}
          <div
            className="flex justify-between items-center px-4 py-3 border-t border-brand-navy/[0.06] dark:border-brand-cyan/[0.10] bg-white/80 dark:bg-brand-slate/60"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {days.map((d, i) => {
              const isToday = i === todayIdx
              const wasStudied = studied[i]
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-brand-navy/40 dark:text-white/35">{d}</span>
                  <div
                    className={`w-[26px] h-[26px] rounded-[9px] flex items-center justify-center text-[11px] font-bold transition-colors ${
                      isToday
                        ? 'text-white'
                        : wasStudied
                          ? 'text-brand-royal dark:text-brand-sky'
                          : 'text-brand-navy/30 dark:text-white/20'
                    }`}
                    style={{
                      background: isToday
                        ? '#0077B6'
                        : wasStudied
                          ? 'rgba(0,180,216,0.16)'
                          : 'transparent',
                      border: (!isToday && !wasStudied) ? '1px dashed rgba(3,4,94,0.12)' : 'none',
                    }}
                  >
                    {wasStudied && !isToday ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : isToday ? '·' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Stats triplet */}
      <div className="px-4 pb-3.5 flex gap-2.5">
        <StatBlock
          value={stats.activeStreak}
          label="day streak"
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 2s4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 1-3s-1 5 3 5 4-4 2-8c2 1 6 4 6 9a8 8 0 1 1-16 0c0-5 4-9 8-11z"/>
            </svg>
          }
          iconColor="#f97316"
        />
        <StatBlock value={stats.completedTopics} label="topics done" />
        <StatBlock value={courses.length} label="courses" />
      </div>

      {/* In progress section */}
      {lastCourse && (
        <>
          <SectionLabel label="In progress" action={{ label: 'See all', href: '/courses' }} />
          <div className="px-4 pb-[18px] flex flex-col gap-2.5">
            {courses
              .filter(c => {
                const done = progressMap[c.code]?.completedTopics.length ?? 0
                return done > 0
              })
              .slice(0, 2)
              .map(c => (
                <CourseRow
                  key={c.code}
                  course={c}
                  done={progressMap[c.code]?.completedTopics.length ?? 0}
                />
              ))
            }
          </div>
        </>
      )}

      {/* All courses grid */}
      <SectionLabel label="All courses" action={{ label: 'View all', href: '/courses' }} />
      <div className="px-4 grid grid-cols-2 gap-3 pb-2">
        {courses.slice(0, 6).map(c => (
          <CourseTile
            key={c.code}
            course={c}
            done={progressMap[c.code]?.completedTopics.length ?? 0}
          />
        ))}
      </div>
      {courses.length > 6 && (
        <div className="px-4 mt-3">
          <Link
            href="/courses"
            className="block text-center py-3 rounded-2xl text-sm font-semibold text-brand-royal dark:text-brand-sky border border-brand-navy/[0.08] dark:border-brand-cyan/[0.12] bg-white/60 dark:bg-brand-slate/40"
          >
            View all {courses.length} courses →
          </Link>
        </div>
      )}
    </div>
  )
}

function SectionLabel({ label, action }: { label: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex justify-between items-baseline px-[20px] mb-2.5">
      <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
        {label}
      </span>
      {action && (
        <Link href={action.href} className="text-[13px] font-semibold text-brand-royal dark:text-brand-sky">
          {action.label}
        </Link>
      )}
    </div>
  )
}

function StatBlock({
  value,
  label,
  icon,
  iconColor,
}: {
  value: number | string
  label: string
  icon?: React.ReactNode
  iconColor?: string
}) {
  return (
    <div
      className="flex-1 p-3 rounded-[20px] bg-white/80 dark:bg-brand-slate/60 border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
      style={{ boxShadow: '0 6px 24px -10px rgba(0,119,182,0.10)' }}
    >
      <div className="flex items-center gap-1 mb-0.5" style={{ color: iconColor || '#0077B6' }}>
        {icon}
        <span
          className="text-[22px] font-semibold text-brand-navy dark:text-white leading-none tracking-[-0.5px]"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
        >
          {value}
        </span>
      </div>
      <span className="text-[10.5px] font-medium tracking-[0.2px] text-brand-navy/45 dark:text-white/35">
        {label}
      </span>
    </div>
  )
}

function CourseRow({ course, done }: { course: Course; done: number }) {
  const total = course.topics.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <Link href={`/courses/${course.code}`} className="block">
      <div
        className="flex gap-3 items-center p-3.5 rounded-[20px] bg-white/80 dark:bg-brand-slate/60 border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10] transition-shadow hover:shadow-md"
        style={{ boxShadow: '0 6px 24px -10px rgba(0,119,182,0.10)' }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: course.accent }}
        >
          {course.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9.5px] font-mono text-brand-navy/40 dark:text-white/30 tracking-[0.5px]">
            [{course.code.toUpperCase()}]
          </p>
          <p className="text-[14px] font-semibold text-brand-navy dark:text-white mt-0.5">
            {course.shortName}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-[6px] bg-brand-navy/[0.08] dark:bg-brand-cyan/[0.12] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: '#0077B6' }}
              />
            </div>
            <span className="text-[10px] font-semibold tabular-nums text-brand-navy/60 dark:text-white/50">
              {done}/{total}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function CourseTile({ course, done }: { course: Course; done: number }) {
  const total = course.topics.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <Link href={`/courses/${course.code}`} className="block">
      <div
        className="rounded-[20px] overflow-hidden bg-white/80 dark:bg-brand-slate/60 border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10] transition-shadow hover:shadow-md"
        style={{ boxShadow: '0 6px 24px -10px rgba(0,119,182,0.10)' }}
      >
        {/* Gradient header */}
        <div
          className="h-[70px] relative overflow-hidden p-3"
          style={{ background: course.accent }}
        >
          <div
            className="absolute rounded-full bg-white/[0.12]"
            style={{ top: -20, right: -20, width: 70, height: 70 }}
          />
          <span className="text-2xl">{course.icon}</span>
        </div>
        {/* Info */}
        <div className="p-3">
          <p className="text-[9px] font-mono text-brand-navy/40 dark:text-white/30 tracking-[0.5px]">
            [{course.code.toUpperCase()}]
          </p>
          <p className="text-[12.5px] font-semibold text-brand-navy dark:text-white mt-0.5 leading-[1.2] min-h-[30px]">
            {course.shortName}
          </p>
          <div className="mt-2 h-[6px] bg-brand-navy/[0.08] dark:bg-brand-cyan/[0.12] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: '#0077B6' }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
