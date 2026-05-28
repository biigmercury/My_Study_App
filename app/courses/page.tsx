'use client'

import { useState, useEffect } from 'react'
import CourseCard from '@/components/CourseCard'
import { COURSES, SEMESTER_1, SEMESTER_2 } from '@/lib/courses'
import { getProgress } from '@/lib/progress'
import type { CourseProgress } from '@/types'

export default function CoursesPage() {
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({})
  const empty: CourseProgress = { completedTopics: [], lastVisited: '' }

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

      {/* Semester 1 */}
      <div className="px-[20px] mb-2.5 flex items-baseline gap-2">
        <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">Semester 1</span>
        <span className="text-[10px] font-mono text-brand-navy/25 dark:text-white/20">{SEMESTER_1.length} courses</span>
      </div>
      <div className="px-4 flex flex-col gap-2.5 mb-5">
        {SEMESTER_1.map(course => (
          <CourseCard
            key={course.code}
            course={course}
            progress={progressMap[course.code] ?? empty}
          />
        ))}
      </div>

      {/* Semester 2 */}
      <div className="px-[20px] mb-2.5 flex items-baseline gap-2">
        <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">Semester 2</span>
        <span className="text-[10px] font-mono text-brand-navy/25 dark:text-white/20">{SEMESTER_2.length} courses</span>
      </div>
      <div className="px-4 flex flex-col gap-2.5">
        {SEMESTER_2.map(course => (
          <CourseCard
            key={course.code}
            course={course}
            progress={progressMap[course.code] ?? empty}
          />
        ))}
      </div>
    </div>
  )
}
