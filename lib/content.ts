import fs from 'fs'
import path from 'path'
import { serialize } from 'next-mdx-remote/serialize'
import matter from 'gray-matter'
import remarkMath from 'remark-math'
// remark-gfm v3 exports as CJS default — import accordingly
// eslint-disable-next-line @typescript-eslint/no-var-requires
const remarkGfm = require('remark-gfm').default
import rehypeKatex from 'rehype-katex'
import type { MDXFrontmatter } from '@/types'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export async function getMDXContent(courseCode: string, topicSlug: string) {
  const filePath = path.join(CONTENT_DIR, courseCode, `${topicSlug}.mdx`)

  if (!fs.existsSync(filePath)) {
    return null
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { content, data } = matter(raw)

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkMath, remarkGfm],
      rehypePlugins: [rehypeKatex as any],
    },
    scope: data,
  })

  return {
    frontmatter: data as MDXFrontmatter,
    source: mdxSource,
  }
}

export function getTopicSlugsForCourse(courseCode: string): string[] {
  const dir = path.join(CONTENT_DIR, courseCode)
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace('.mdx', ''))
}
