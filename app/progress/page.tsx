'use client'

import { useState, useEffect } from 'react'
import { COURSES } from '@/lib/courses'
import { getProgress } from '@/lib/progress'
import ProgressBar from '@/components/ProgressBar'
import type { CourseProgress } from '@/types'

export default function ProgressPage() {
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({})
  const empty: CourseProgress = { completedTopics: [], lastVisited: '' }

  useEffect(() => {
    setProgressMap(getProgress())
  }, [])

  const totalTopics = COURSES.reduce((s, c) => s + c.topics.length, 0)
  const totalCompleted = Object.values(progressMap).reduce((s, p) => s + p.completedTopics.length, 0)
  const overallPct = totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-black text-slate-800 dark:text-white mb-1">Progress</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Track your study progress across all courses</p>

      {/* Overall */}
      <div className="rounded-2xl p-5 bg-brand-gradient mb-5 text-white">
        <p className="text-white/80 text-xs mb-1">Overall completion</p>
        <p className="text-4xl font-black">{overallPct}%</p>
        <p className="text-white/70 text-xs mt-1">{totalCompleted} of {totalTopics} topics done</p>
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Per course */}
      <div className="space-y-3">
        {COURSES.map(course => {
          const p = progressMap[course.code] ?? empty
          const done = p.completedTopics.length
          const total = course.topics.length
          if (done === 0) return null
          return (
            <div key={course.code} className="bg-white dark:bg-brand-slate rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/40 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: course.accent }}>
                  {course.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{course.shortName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{done}/{total} topics</p>
                </div>
                <span className="text-sm font-black text-brand-royal dark:text-brand-sky">
                  {Math.round((done / total) * 100)}%
                </span>
              </div>
              <ProgressBar completed={done} total={total} />
            </div>
          )
        })}
      </div>

      {totalCompleted === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-bold text-slate-700 dark:text-slate-300">No progress yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start studying to track your progress here</p>
        </div>
      )}
    </div>
  )
}
