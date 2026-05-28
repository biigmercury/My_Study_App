import Link from 'next/link'
import type { Course, CourseProgress } from '@/types'

interface CourseCardProps {
  course: Course
  progress: CourseProgress
}

export default function CourseCard({ course, progress }: CourseCardProps) {
  const completed = progress.completedTopics.length
  const total = course.topics.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Link href={`/courses/${course.code}`} className="block">
      <div
        className="flex gap-3 items-center p-3.5 rounded-[20px] bg-white dark:bg-brand-surface border border-brand-navy/[0.06] dark:border-brand-cyan/[0.10] transition-shadow hover:shadow-lg"
        style={{ boxShadow: 'var(--card-shadow)' }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: course.accent }}
        >
          {course.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9.5px] font-mono text-brand-navy/40 dark:text-white/30 tracking-[0.5px]">
            [{course.code.toUpperCase()}]
          </p>
          <p className="text-[14px] font-semibold text-brand-navy dark:text-white mt-0.5 truncate">
            {course.shortName}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-[6px] bg-brand-navy/[0.08] dark:bg-brand-cyan/[0.12] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: '#00B4D8' }}
              />
            </div>
            <span className="text-[10px] font-semibold tabular-nums text-brand-navy/60 dark:text-white/50">
              {completed}/{total}
            </span>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-navy/20 dark:text-white/20 flex-shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  )
}
