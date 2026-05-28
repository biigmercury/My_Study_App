'use client'

import { useState } from 'react'
import Link from 'next/link'
import { COURSES } from '@/lib/courses'
import type { Course, Topic } from '@/types'

interface SearchResult {
  course: Course
  topic: Topic
}

const RECENT = ['Inheritance', 'Big-O', 'Karnaugh map', 'Normal distribution']

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
    <div className="pb-4">
      {/* Title */}
      <div className="px-[22px] pt-2 pb-3.5">
        <h1
          className="text-[30px] font-semibold text-brand-navy dark:text-white tracking-[-0.7px]"
          style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
        >
          Search
        </h1>
      </div>

      {/* Search input */}
      <div className="px-4 pb-4">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-navy/40 dark:text-white/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search topics, courses, formulas…"
            autoFocus
            className="w-full pl-[42px] pr-4 py-[13px] rounded-2xl text-[14px] text-brand-navy dark:text-white placeholder:text-brand-navy/35 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-royal/30 dark:focus:ring-brand-sky/30"
            style={{
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(3,4,94,0.07)',
              backdropFilter: 'blur(14px)',
            }}
          />
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="px-4">
          <p className="text-[11px] font-semibold text-brand-navy/40 dark:text-white/30 tracking-[0.4px] mb-2 px-1.5">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-col gap-2">
            {results.slice(0, 8).map(({ course, topic }) => (
              <Link
                key={`${course.code}-${topic.slug}`}
                href={`/courses/${course.code}/${topic.slug}`}
                className="block"
              >
                <div
                  className="flex gap-2.5 items-center p-3 rounded-[16px] bg-white/80 dark:bg-brand-slate/60 border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10] transition-shadow hover:shadow-md"
                  style={{ boxShadow: '0 4px 16px -8px rgba(0,119,182,0.10)' }}
                >
                  <div
                    className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[16px] flex-shrink-0"
                    style={{ background: course.accent }}
                  >
                    {course.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-brand-navy dark:text-white">{topic.title}</p>
                    <p className="text-[10.5px] font-mono text-brand-navy/40 dark:text-white/30 mt-0.5">
                      [{course.code.toUpperCase()}] · {topic.duration}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-navy/25 dark:text-white/20 flex-shrink-0">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {query.trim().length > 1 && results.length === 0 && (
        <div className="text-center py-[50px] px-6">
          <p className="text-[30px] mb-1.5">🔍</p>
          <p
            className="text-[13.5px] font-semibold text-brand-navy dark:text-white"
            style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
          >
            No results
          </p>
          <p className="text-[12px] text-brand-navy/50 dark:text-white/40 mt-1">
            Try a different word or browse by course below.
          </p>
        </div>
      )}

      {/* Empty state — recent + browse */}
      {!query && (
        <>
          <div className="px-[20px] mb-2">
            <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
              Recent
            </span>
          </div>
          <div className="px-4 mb-5 flex flex-wrap gap-2">
            {RECENT.map(r => (
              <button
                key={r}
                onClick={() => setQuery(r)}
                className="px-3 py-[7px] rounded-full text-[12px] font-medium text-brand-navy/70 dark:text-white/60 border border-brand-navy/[0.08] dark:border-brand-cyan/[0.12]"
                style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="px-[20px] mb-2">
            <span className="text-[11px] font-bold tracking-[0.8px] uppercase text-brand-navy/45 dark:text-white/35">
              Browse by course
            </span>
          </div>
          <div className="px-4 grid grid-cols-2 gap-2">
            {COURSES.map(course => (
              <Link key={course.code} href={`/courses/${course.code}`} className="block">
                <div
                  className="flex items-center gap-2 p-2.5 rounded-[16px] bg-white/80 dark:bg-brand-slate/60 border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10] transition-shadow hover:shadow-sm"
                  style={{ boxShadow: '0 4px 16px -8px rgba(0,119,182,0.08)' }}
                >
                  <span className="text-[18px]">{course.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-mono text-brand-navy/35 dark:text-white/25">[{course.code.toUpperCase()}]</p>
                    <p className="text-[11.5px] font-semibold text-brand-navy dark:text-white leading-[1.2] truncate">{course.shortName}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
