import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCourse } from '@/lib/courses'
import { getMDXContent } from '@/lib/content'
import LessonReader from '@/components/LessonReader'

interface LessonPageProps {
  params: { code: string; topic: string }
}

export async function generateMetadata({ params }: LessonPageProps) {
  const course = getCourse(params.code)
  const mdx = await getMDXContent(params.code, params.topic)
  if (!course || !mdx) return {}
  return {
    title: `${mdx.frontmatter.title} — ${course.shortName} | StudyOS`,
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const course = getCourse(params.code)
  if (!course) notFound()

  const mdx = await getMDXContent(params.code, params.topic)
  if (!mdx) notFound()

  const topic = course.topics.find(t => t.slug === params.topic)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-4 py-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-brand-slate border-b border-slate-200 dark:border-slate-700/40">
        <Link href="/courses" className="hover:text-brand-royal dark:hover:text-brand-sky transition-colors">Courses</Link>
        <span>/</span>
        <Link href={`/courses/${course.code}`} className="hover:text-brand-royal dark:hover:text-brand-sky transition-colors truncate max-w-[120px]">{course.shortName}</Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{topic?.title ?? params.topic}</span>
      </div>

      <LessonReader
        frontmatter={mdx.frontmatter}
        courseCode={course.code}
        topicSlug={params.topic}
        courseAccent={course.accent}
      >
        {mdx.content}
      </LessonReader>
    </div>
  )
}
