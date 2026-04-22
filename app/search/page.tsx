'use client'

import { useState } from 'react'
import Link from 'next/link'
import { COURSES } from '@/lib/courses'
import type { Course, Topic } from '@/types'

interface SearchResult {
  course: Course
  topic: Topic
}

export default function SearchPage() {
  const [query, setQuery] = useState('')

  const results: SearchResult[] = query.trim().length > 1
    ? COURSES.flatMap(course =>
        course.topics
          .filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
          .map(topic => ({ course, topic }))
      )
    : []

  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-black text-slate-800 dark:text-white mb-3">Search</h1>

      <div className="relative mb-4">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search topics across all courses..."
          autoFocus
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-brand-slate border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-royal dark:focus:ring-brand-sky"
        />
      </div>

      {query.trim().length > 1 && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No topics found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map(({ course, topic }) => (
            <Link
              key={`${course.code}-${topic.slug}`}
              href={`/courses/${course.code}/${topic.slug}`}
              className="block bg-white dark:bg-brand-slate rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/40 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5" style={{ background: course.accent }}>
                  {course.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">{topic.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">[{course.code.toUpperCase()}] {course.shortName} · {topic.duration}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!query && (
        <div className="mt-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mb-3">Browse by course</p>
          <div className="grid grid-cols-2 gap-2">
            {COURSES.map(course => (
              <Link key={course.code} href={`/courses/${course.code}`}>
                <div className="rounded-xl p-3 flex items-center gap-2 border border-slate-200/60 dark:border-slate-700/40 bg-white dark:bg-brand-slate hover:shadow-sm transition-shadow">
                  <span className="text-lg">{course.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider">[{course.code.toUpperCase()}]</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{course.shortName}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
