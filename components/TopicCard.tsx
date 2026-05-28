'use client'

import Link from 'next/link'
import type { Topic } from '@/types'

interface TopicCardProps {
  topic: Topic
  courseCode: string
  isCompleted: boolean
  onToggle: () => void
}

const diffChipLight: Record<string, [string, string]> = {
  beginner:     ['#dcfce7', '#15803d'],
  intermediate: ['#cffafe', '#0e7490'],
  advanced:     ['#ede9fe', '#6d28d9'],
}

export default function TopicCard({ topic, courseCode, isCompleted, onToggle }: TopicCardProps) {
  const [chipBg, chipFg] = diffChipLight[topic.difficulty] ?? diffChipLight.beginner

  return (
    <div
      className={`flex items-center gap-3 p-3.5 rounded-[16px] border transition-all ${
        isCompleted
          ? 'border-brand-royal/25 dark:border-brand-royal/20 bg-brand-royal/[0.04] dark:bg-brand-royal/[0.06]'
          : 'border-brand-navy/[0.06] dark:border-brand-cyan/[0.10] bg-white dark:bg-brand-surface'
      }`}
      style={{ boxShadow: 'var(--card-shadow)' }}
    >
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isCompleted
            ? 'bg-brand-royal border-brand-royal'
            : 'border-brand-navy/25 dark:border-white/20 hover:border-brand-royal'
        }`}
      >
        {isCompleted && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <Link href={`/courses/${courseCode}/${topic.slug}`} className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${
          isCompleted ? 'text-brand-navy/45 dark:text-white/35 line-through decoration-brand-royal/30' : 'text-brand-navy dark:text-white'
        }`}>
          {topic.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-brand-navy/40 dark:text-white/30">{topic.duration}</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
            style={{ background: chipBg, color: chipFg }}
          >
            {topic.difficulty}
          </span>
        </div>
      </Link>

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-navy/20 dark:text-white/20 flex-shrink-0">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  )
}
