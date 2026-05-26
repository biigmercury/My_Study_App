'use client'

import Link from 'next/link'
import type { Topic } from '@/types'

interface TopicCardProps {
  topic: Topic
  courseCode: string
  isCompleted: boolean
  hasContent: boolean
  onToggle: () => void
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
}

export default function TopicCard({ topic, courseCode, isCompleted, hasContent, onToggle }: TopicCardProps) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-brand-slate shadow-sm border transition-all ${
      isCompleted
        ? 'border-brand-ocean/30 dark:border-brand-cyan/30 bg-brand-frost/60 dark:bg-brand-navy/40'
        : 'border-brand-ice/60 dark:border-brand-ocean/20'
    }`}>
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isCompleted
            ? 'bg-brand-ocean dark:bg-brand-cyan border-brand-ocean dark:border-brand-cyan'
            : 'border-slate-300 dark:border-brand-ice/40 hover:border-brand-ocean dark:hover:border-brand-cyan'
        }`}
      >
        {isCompleted && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {hasContent ? (
        <Link href={`/courses/${courseCode}/${topic.slug}`} className="flex-1 min-w-0">
          <TopicContent topic={topic} isCompleted={isCompleted} />
        </Link>
      ) : (
        <div className="flex-1 min-w-0 opacity-60">
          <TopicContent topic={topic} isCompleted={isCompleted} />
          <span className="text-[10px] text-slate-400 mt-0.5 block">Coming soon</span>
        </div>
      )}

      {hasContent && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 dark:text-slate-600 flex-shrink-0">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </div>
  )
}

function TopicContent({ topic, isCompleted }: { topic: Topic; isCompleted: boolean }) {
  return (
    <>
      <p className={`font-medium text-sm leading-tight ${isCompleted ? 'text-slate-500 dark:text-brand-ice/50 line-through decoration-brand-ocean/40' : 'text-slate-800 dark:text-white'}`}>
        {topic.title}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-slate-400">{topic.duration}</span>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${difficultyColors[topic.difficulty]}`}>
          {topic.difficulty}
        </span>
      </div>
    </>
  )
}
