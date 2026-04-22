'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TopicCard from '@/components/TopicCard'
import ProgressBar from '@/components/ProgressBar'
import { getCourse } from '@/lib/courses'
import { getCourseProgress, markTopicComplete, markTopicIncomplete } from '@/lib/progress'
import type { CourseProgress } from '@/types'

export default function CoursePage() {
  const params = useParams<{ code: string }>()
  const course = getCourse(params.code)

  const [progress, setProgress] = useState<CourseProgress>({ completedTopics: [], lastVisited: '' })
  const [availableSlugs, setAvailableSlugs] = useState<string[]>([])

  useEffect(() => {
    setProgress(getCourseProgress(params.code))
    // Fetch which topics have MDX content
    fetch(`/api/topics/${params.code}`)
      .then(r => r.json())
      .then(data => setAvailableSlugs(data.slugs ?? []))
      .catch(() => setAvailableSlugs([]))
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

  return (
    <div>
      {/* Course Header */}
      <div className="relative overflow-hidden" style={{ background: course.accent }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-16 translate-x-16" />
        <div className="relative px-4 pt-5 pb-6">
          <Link href="/courses" className="flex items-center gap-1 text-white/80 text-xs mb-3 w-fit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            All Courses
          </Link>
          <span className="text-4xl block mb-2">{course.icon}</span>
          <h1 className="text-xl font-black text-white leading-tight">{course.name}</h1>
          <p className="text-white/70 text-xs mt-1">{course.creditHours} credit hours · {course.topics.length} topics</p>
          <p className="text-white/60 text-xs mt-2 leading-relaxed">{course.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 bg-white dark:bg-brand-slate border-b border-slate-200 dark:border-slate-700/40">
        <ProgressBar completed={progress.completedTopics.length} total={course.topics.length} showLabel />
      </div>

      {/* Topics list */}
      <div className="px-4 pt-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Topics</h2>
        <div className="flex flex-col gap-2">
          {course.topics.map(topic => (
            <TopicCard
              key={topic.slug}
              topic={topic}
              courseCode={course.code}
              isCompleted={progress.completedTopics.includes(topic.slug)}
              hasContent={availableSlugs.includes(topic.slug)}
              onToggle={() => toggleTopic(topic.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
