import fs from 'fs'
import path from 'path'
import { compileMDX } from 'next-mdx-remote/rsc'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import type { MDXFrontmatter } from '@/types'
import { mdxComponents } from '@/lib/mdx-components'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export async function getMDXContent(courseCode: string, topicSlug: string) {
  const filePath = path.join(CONTENT_DIR, courseCode, `${topicSlug}.mdx`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  const raw = fs.readFileSync(filePath, 'utf-8')

  const { content, frontmatter } = await compileMDX<MDXFrontmatter>({
    source: raw,
    components: mdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkMath, remarkGfm],
        rehypePlugins: [rehypeKatex as any],
      },
    },
  })

  return { content, frontmatter }
}

export function getTopicSlugsForCourse(courseCode: string): string[] {
  const dir = path.join(CONTENT_DIR, courseCode)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace('.mdx', ''))
}
