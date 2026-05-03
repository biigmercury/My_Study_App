'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CourseCard from '@/components/CourseCard'
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

export default function HomeClient({ courses }: HomeClientProps) {
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({})
  const [stats, setStats] = useState({ completedTopics: 0, totalTopics: 0, activeStreak: 0, lastCourseCode: null as string | null })

  useEffect(() => {
    const all = getProgress()
    setProgressMap(all)
    setStats(getOverallStats(getTotalTopicCount()))
  }, [])

  const emptyCourseProgress: CourseProgress = { completedTopics: [], lastVisited: '' }
  const lastCourse = stats.lastCourseCode ? courses.find(c => c.code === stats.lastCourseCode) : null

  return (
    <div>
      {/* Hero */}
      <div className="px-4 pt-5 pb-1">
        <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1d4ed8, #38bdf8)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
          <div className="relative p-5">
            <p className="text-white/80 text-sm mb-0.5">{getGreeting()},</p>
            <h1 className="text-2xl font-black text-white">Scholar 👋</h1>
            <p className="text-white/70 text-xs mt-2">
              {new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-3">
        <StatCard value={courses.length} label="Courses" icon="📚" />
        <StatCard value={stats.completedTopics} label="Completed" icon="✅" />
        <StatCard value={stats.activeStreak} label="Day Streak" icon="🔥" />
      </div>

      {/* Continue studying */}
      {lastCourse && (
        <div className="px-4 mt-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Continue Studying</h2>
          <Link href={`/courses/${lastCourse.code}`} className="block">
            <div className="rounded-2xl p-4 flex items-center gap-4 bg-white dark:bg-brand-slate border border-slate-200/60 dark:border-slate-700/40 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: lastCourse.accent }}>
                {lastCourse.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">[{lastCourse.code.toUpperCase()}]</p>
                <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{lastCourse.shortName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {(progressMap[lastCourse.code]?.completedTopics.length ?? 0)}/{lastCourse.topics.length} topics
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        </div>
      )}

      {/* All courses */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">All Courses</h2>
          <Link href="/courses" className="text-xs text-brand-royal dark:text-brand-sky font-semibold">See all</Link>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {courses.slice(0, 6).map(course => (
            <CourseCard
              key={course.code}
              course={course}
              progress={progressMap[course.code] ?? emptyCourseProgress}
            />
          ))}
        </div>
        {courses.length > 6 && (
          <Link href="/courses" className="block mt-3 text-center py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-brand-royal dark:text-brand-sky">
            View all {courses.length} courses →
          </Link>
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div className="bg-white dark:bg-brand-slate rounded-2xl p-3 border border-slate-200/60 dark:border-slate-700/40 shadow-sm text-center">
      <span className="text-lg">{icon}</span>
      <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}
