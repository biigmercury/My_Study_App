'use client'

import { useState, useEffect, useRef } from 'react'
import { markTopicComplete, markTopicIncomplete, getCourseProgress } from '@/lib/progress'
import QuizModal from '@/components/QuizModal'
import type { MDXFrontmatter } from '@/types'

const QUIZ_PW_HASH = 'f21d987b2635411ab0f1bc7833d6c2e6c6a37292adb13707043237d88af003c6'

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

interface LessonReaderProps {
  children: React.ReactNode
  frontmatter: MDXFrontmatter
  courseCode: string
  topicSlug: string
  courseAccent: string
}

const difficultyColors: Record<string, [string, string]> = {
  beginner:     ['#dcfce7', '#15803d'],
  intermediate: ['#cffafe', '#0e7490'],
  advanced:     ['#ede9fe', '#6d28d9'],
}
const difficultyColorsDark: Record<string, [string, string]> = {
  beginner:     ['rgba(74,222,128,0.16)', '#86efac'],
  intermediate: ['rgba(0,180,216,0.18)',  '#7dd3fc'],
  advanced:     ['rgba(196,181,253,0.18)','#c4b5fd'],
}

export default function LessonReader({ children, frontmatter, courseCode, topicSlug, courseAccent }: LessonReaderProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const scrollRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const progress = getCourseProgress(courseCode)
    setIsCompleted(progress.completedTopics.includes(topicSlug))
  }, [courseCode, topicSlug])

  // Reading progress strip — listen on the page scroll
  useEffect(() => {
    const handler = () => {
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      setScrollPct(max > 0 ? Math.min(1, el.scrollTop / max) : 0)
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const toggleComplete = () => {
    if (isCompleted) {
      markTopicIncomplete(courseCode, topicSlug)
      setIsCompleted(false)
    } else {
      markTopicComplete(courseCode, topicSlug)
      setIsCompleted(true)
    }
  }

  const level = (frontmatter.difficulty ?? 'beginner') as string
  const diffLight = difficultyColors[level] ?? difficultyColors.beginner
  const diffDark  = difficultyColorsDark[level] ?? difficultyColorsDark.beginner

  return (
    <article className="pb-10">
      {/* Reading progress strip */}
      <div className="sticky top-14 left-0 right-0 z-30 h-[3px] bg-transparent">
        <div
          className="h-full transition-[width] duration-75 linear"
          style={{ width: `${scrollPct * 100}%`, background: '#00B4D8' }}
        />
      </div>

      {/* Hero header */}
      <div
        className="px-[22px] pt-4 pb-[22px] relative overflow-hidden text-white"
        style={{ background: courseAccent }}
      >
        <div
          className="absolute rounded-full bg-white/[0.10]"
          style={{ top: -40, right: -30, width: 160, height: 160 }}
        />
        <div className="relative">
          <p
            className="text-[10.5px] font-mono text-white/70 tracking-[0.6px] mb-3.5"
          >
            [{courseCode.toUpperCase()}] · LESSON
          </p>
          <h1
            className="text-[28px] font-semibold leading-[1.05] tracking-[-0.5px]"
            style={{ fontFamily: '"New York", ui-serif, Georgia, serif' }}
          >
            {frontmatter.title}
          </h1>
          {frontmatter.description && (
            <p className="text-[13px] text-white/88 mt-2 leading-[1.45]">
              {frontmatter.description}
            </p>
          )}
          <div className="flex items-center gap-2.5 mt-3">
            {/* Difficulty chip — light/dark via CSS class trick */}
            <span
              className="text-[10px] font-semibold tracking-[0.2px] px-2 py-0.5 rounded-full capitalize"
              style={{
                background: diffLight[0],
                color: diffLight[1],
              }}
            >
              {level}
            </span>
            {frontmatter.duration && (
              <span className="text-[11.5px] text-white/80">· {frontmatter.duration}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div
        className="sticky top-14 z-20 px-4 py-3 flex gap-2.5 border-b border-brand-navy/[0.06] dark:border-brand-cyan/[0.10]"
        style={{ background: 'var(--action-bar-bg)' }}
      >
        <style>{`
          :root { --action-bar-bg: #F4FAFC; }
          .dark { --action-bar-bg: #01022E; }
        `}</style>
        <button
          onClick={toggleComplete}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold border transition-all ${
            isCompleted
              ? 'bg-green-50 dark:bg-green-950/30 border-green-300/60 dark:border-green-700/50 text-green-700 dark:text-green-400'
              : 'bg-white/80 dark:bg-brand-slate/60 border-brand-navy/[0.08] dark:border-brand-cyan/[0.12] text-brand-navy dark:text-white'
          }`}
        >
          {isCompleted ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Completed
            </>
          ) : (
            'Mark complete'
          )}
        </button>
        <button
          onClick={() => setQuizOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-[13px] font-semibold"
          style={{
            background: 'linear-gradient(135deg, #0077B6, #00B4D8)',
            boxShadow: '0 6px 18px -6px #00B4D888',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
          </svg>
          Quiz me
        </button>
      </div>

      {/* MDX Content */}
      <div className="px-5 pt-6">
        <div className="prose prose-slate dark:prose-invert max-w-none
          prose-headings:font-semibold
          prose-headings:text-brand-navy dark:prose-headings:text-white
          prose-h2:text-[20px] prose-h2:mt-8 prose-h2:mb-3 prose-h2:[font-family:'New_York',ui-serif,Georgia,serif] prose-h2:tracking-[-0.3px]
          prose-h3:text-[16px] prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-[14.5px] prose-p:leading-[1.6] prose-p:text-brand-navy/75 dark:prose-p:text-white/75
          prose-ul:text-[14px] prose-ol:text-[14px]
          prose-li:text-brand-navy/75 dark:prose-li:text-white/75
          prose-strong:text-brand-navy dark:prose-strong:text-white prose-strong:font-semibold
          prose-code:before:content-none prose-code:after:content-none
          prose-code:bg-brand-navy/[0.06] dark:prose-code:bg-brand-cyan/[0.10] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px]
          prose-pre:bg-[#021037] prose-pre:rounded-2xl
          prose-a:text-brand-royal dark:prose-a:text-brand-sky prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-l-brand-royal dark:prose-blockquote:border-l-brand-sky
          prose-blockquote:bg-brand-mist/60 dark:prose-blockquote:bg-brand-navy/30
          prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4
          prose-hr:border-brand-navy/[0.08] dark:prose-hr:border-brand-cyan/[0.10]
          prose-table:text-xs prose-table:w-full
          prose-th:bg-brand-mist dark:prose-th:bg-brand-slate prose-th:font-semibold prose-th:text-brand-navy dark:prose-th:text-white/90 prose-th:px-3 prose-th:py-2
          prose-td:px-3 prose-td:py-2 prose-td:text-brand-navy/75 dark:prose-td:text-white/70
        ">
          {children}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-4 mt-8">
        <button
          onClick={toggleComplete}
          className="w-full py-[14px] rounded-[18px] font-bold text-[14px] text-white flex items-center justify-center gap-2 transition-all"
          style={{
            background: isCompleted ? '#22c55e' : 'linear-gradient(135deg, #0077B6, #00B4D8)',
            boxShadow: `0 10px 28px -10px ${isCompleted ? '#22c55e99' : '#00B4D899'}`,
          }}
        >
          {isCompleted ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Topic complete
            </>
          ) : (
            <>
              Mark as complete
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </>
          )}
        </button>
      </div>

      <QuizModal
        courseCode={courseCode}
        topicSlug={topicSlug}
        topicTitle={frontmatter.title}
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
      />
    </article>
  )
}
