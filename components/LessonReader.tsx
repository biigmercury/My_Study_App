'use client'

import { useState, useEffect } from 'react'
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

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
}

export default function LessonReader({ children, frontmatter, courseCode, topicSlug, courseAccent }: LessonReaderProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [pwModalOpen, setPwModalOpen] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)
  const [quizUnlocked, setQuizUnlocked] = useState(false)

  useEffect(() => {
    const progress = getCourseProgress(courseCode)
    setIsCompleted(progress.completedTopics.includes(topicSlug))
    setQuizUnlocked(sessionStorage.getItem('quiz_unlocked') === '1')
  }, [courseCode, topicSlug])

  const handleQuizClick = () => {
    if (quizUnlocked) {
      setQuizOpen(true)
    } else {
      setPwInput('')
      setPwError(false)
      setPwModalOpen(true)
    }
  }

  const handlePwSubmit = async () => {
    const hash = await sha256(pwInput)
    if (hash === QUIZ_PW_HASH) {
      sessionStorage.setItem('quiz_unlocked', '1')
      setQuizUnlocked(true)
      setPwModalOpen(false)
      setQuizOpen(true)
    } else {
      setPwError(true)
    }
  }

  const toggleComplete = () => {
    if (isCompleted) {
      markTopicIncomplete(courseCode, topicSlug)
      setIsCompleted(false)
    } else {
      markTopicComplete(courseCode, topicSlug)
      setIsCompleted(true)
    }
  }

  return (
    <article className="pb-8">
      {/* Hero header */}
      <div className="px-4 pt-4 pb-6 relative overflow-hidden" style={{ background: courseAccent }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-10 translate-x-10" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wide`}>
              {frontmatter.difficulty}
            </span>
            <span className="text-[10px] text-white/70">{frontmatter.duration}</span>
          </div>
          <h1 className="text-xl font-black text-white leading-tight">{frontmatter.title}</h1>
          {frontmatter.description && (
            <p className="text-sm text-white/80 mt-1.5 leading-relaxed">{frontmatter.description}</p>
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="px-4 py-3 flex gap-2 bg-white dark:bg-brand-slate border-b border-slate-200 dark:border-slate-700/40 sticky top-14 z-30">
        <button
          onClick={toggleComplete}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            isCompleted
              ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-brand-royal dark:hover:border-brand-sky'
          }`}
        >
          {isCompleted ? '✓ Completed' : 'Mark Complete'}
        </button>
        <button
          onClick={handleQuizClick}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold shadow-sm shadow-blue-500/20"
        >
          <span>✨</span> Quiz Me
        </button>
      </div>

      {/* MDX Content */}
      <div className="px-4 pt-6">
        <div className="prose prose-slate dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:text-slate-800 dark:prose-headings:text-white
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
          prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-sm prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300
          prose-ul:text-sm prose-ol:text-sm
          prose-li:text-slate-700 dark:prose-li:text-slate-300
          prose-strong:text-slate-800 dark:prose-strong:text-white
          prose-code:before:content-none prose-code:after:content-none
          prose-a:text-brand-royal dark:prose-a:text-brand-sky
          prose-blockquote:border-l-brand-royal dark:prose-blockquote:border-l-brand-sky
          prose-hr:border-slate-200 dark:prose-hr:border-slate-700
          prose-table:text-xs prose-table:w-full
          prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:font-semibold prose-th:text-slate-700 dark:prose-th:text-slate-300 prose-th:px-3 prose-th:py-2
          prose-td:px-3 prose-td:py-2 prose-td:text-slate-700 dark:prose-td:text-slate-300
        ">
          {children}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-4 mt-8">
        <button
          onClick={toggleComplete}
          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${
            isCompleted
              ? 'bg-green-500 text-white'
              : 'bg-brand-gradient text-white shadow-lg shadow-blue-500/30'
          }`}
        >
          {isCompleted ? '✓ Topic Complete! Tap to unmark' : 'Mark as Complete ✓'}
        </button>
      </div>

      <QuizModal
        courseCode={courseCode}
        topicSlug={topicSlug}
        topicTitle={frontmatter.title}
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
      />

      {pwModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1">Quiz Access</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Enter your password to generate a quiz.</p>
            <input
              type="password"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              onKeyDown={e => e.key === 'Enter' && handlePwSubmit()}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm outline-none focus:border-brand-royal dark:focus:border-brand-sky mb-1"
            />
            {pwError && <p className="text-xs text-red-500 mb-3">Incorrect password.</p>}
            {!pwError && <div className="mb-3" />}
            <div className="flex gap-2">
              <button
                onClick={() => setPwModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePwSubmit}
                className="flex-1 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
