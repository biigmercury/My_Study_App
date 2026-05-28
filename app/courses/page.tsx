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
    <div className="pb-4">
      <div className="px-[22px] pt-2 pb-4">
        <h1
          className="text-[30px] font-semibold text-brand-navy dark:text-white tracking-[-0.7px]"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
        >
          Courses
        </h1>
        <p className="text-[13px] text-brand-navy/60 dark:text-white/50 mt-0.5">
          {COURSES.length} courses · {COURSES.reduce((s, c) => s + c.topics.length, 0)} topics
        </p>
      </div>
      <div className="px-4 flex flex-col gap-2.5">
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
