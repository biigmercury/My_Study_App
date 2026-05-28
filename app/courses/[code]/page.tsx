'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TopicCard from '@/components/TopicCard'
import { getCourse } from '@/lib/courses'
import { getCourseProgress, markTopicComplete, markTopicIncomplete } from '@/lib/progress'
import type { CourseProgress } from '@/types'

export default function CoursePage() {
  const params = useParams<{ code: string }>()
  const course = getCourse(params.code)

  const [progress, setProgress] = useState<CourseProgress>({ completedTopics: [], lastVisited: '' })

  useEffect(() => {
    setProgress(getCourseProgress(params.code))
  }, [params.code])

  if (!course) {
    notFound()
  }

  const toggleTopic = (slug: string) => {
    const isCompleted = progress.completedTopics.includes(slug)
    if (isCompleted) {
      markTopicIncomplete(params.code, slug)
    } else {
      markTopicComplete(params.code, slug)
    }
    setProgress(getCourseProgress(params.code))
  }

  const done = progress.completedTopics.length
  const total = course.topics.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="pb-4">
      {/* Course hero header */}
      <div className="relative overflow-hidden text-white" style={{ background: course.accent }}>
        <div className="absolute rounded-full bg-white/10" style={{ top: -64, right: -64, width: 192, height: 192 }} />
        <div className="relative px-[22px] pt-5 pb-6">
          <Link href="/courses" className="flex items-center gap-1 text-white/80 text-[12px] mb-4 w-fit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            All Courses
          </Link>
          <span className="text-[40px] block mb-2">{course.icon}</span>
          <h1
            className="text-[22px] font-semibold leading-tight"
            style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
          >
            {course.name}
          </h1>
          <p className="text-white/70 text-[12px] mt-1 font-mono">
            {course.creditHours} credit hours · {course.topics.length} topics
          </p>
          <p className="text-white/60 text-[12px] mt-2 leading-relaxed">{course.description}</p>
        </div>
      </div>

      {/* Progress strip */}
      <div
        className="px-4 py-3 border-b border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
        style={{ background: 'var(--action-bar-bg)' }}
      >
        <style>{`
          :root { --action-bar-bg: #F4FAFC; }
          .dark { --action-bar-bg: #01022E; }
        `}</style>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-brand-navy/55 dark:text-white/45">
            {done}/{total} topics completed
          </span>
          <span
            className="text-[13px] font-semibold text-brand-navy dark:text-white"
            style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
          >
            {pct}%
          </span>
        </div>
        <div className="h-[6px] bg-brand-navy/[0.08] dark:bg-brand-cyan/[0.12] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: '#00B4D8' }}
          />
        </div>
      </div>

      {/* Topics list */}
      <div className="px-4 pt-4">
        <h2 className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35 mb-3">
          Topics
        </h2>
        <div className="flex flex-col gap-2">
          {course.topics.map(topic => (
            <TopicCard
              key={topic.slug}
              topic={topic}
              courseCode={course.code}
              isCompleted={progress.completedTopics.includes(topic.slug)}
              onToggle={() => toggleTopic(topic.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
