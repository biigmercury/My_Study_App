'use client'

import { useState, useEffect } from 'react'
import CourseCard from '@/components/CourseCard'
import { COURSES } from '@/lib/courses'
import { getProgress } from '@/lib/progress'
import type { CourseProgress } from '@/types'

export default function CoursesPage() {
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({})
  const emptyCourseProgress: CourseProgress = { completedTopics: [], lastVisited: '' }

  useEffect(() => {
    setProgressMap(getProgress())
  }, [])

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="mb-4">
        <h1 className="text-xl font-black text-slate-800 dark:text-white">All Courses</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{COURSES.length} courses this session</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {COURSES.map(course => (
          <CourseCard
            key={course.code}
            course={course}
            progress={progressMap[course.code] ?? emptyCourseProgress}
          />
        ))}
      </div>
    </div>
  )
}
