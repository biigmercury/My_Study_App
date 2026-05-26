import Link from 'next/link'
import ProgressBar from '@/components/ProgressBar'
import type { Course, CourseProgress } from '@/types'

interface CourseCardProps {
  course: Course
  progress: CourseProgress
}

export default function CourseCard({ course, progress }: CourseCardProps) {
  const completed = progress.completedTopics.length
  const total = course.topics.length

  return (
    <Link href={`/courses/${course.code}`} className="block group">
      <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-700/40 bg-white dark:bg-brand-slate hover:shadow-md transition-shadow">
        <div
          className="p-4 text-white relative overflow-hidden"
          style={{ background: course.accent }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
          <div className="relative">
            <span className="text-3xl block mb-1">{course.icon}</span>
            <p className="text-[10px] font-mono text-white/60 uppercase tracking-wider mb-0.5">[{course.code.toUpperCase()}]</p>
            <h3 className="font-bold text-base leading-tight">{course.shortName}</h3>
            <p className="text-white/70 text-xs mt-0.5">{course.creditHours} credit hours</p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
            {course.description}
          </p>
          <ProgressBar completed={completed} total={total} />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
            {completed}/{total} topics completed
          </p>
        </div>
      </div>
    </Link>
  )
}
