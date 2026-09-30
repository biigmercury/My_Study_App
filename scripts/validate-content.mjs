// Validate lesson MDX before shipping:
//   node scripts/validate-content.mjs <course> [<course> ...]   (or a single .mdx path)
// Checks: MDX compiles with the same plugins as lib/content.ts, KaTeX parses,
// every mermaid block renders on mermaid.ink, every local image exists in public/.
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { compile } from '@mdx-js/mdx'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const files = args.flatMap(a =>
  a.endsWith('.mdx')
    ? [a]
    : fs.readdirSync(path.join(ROOT, 'content', a)).filter(f => f.endsWith('.mdx')).map(f => path.join('content', a, f)),
)

let failures = 0
const fail = (file, msg) => { failures++; console.log(`FAIL ${file}: ${msg}`) }

for (const file of files) {
  const before = failures
  const raw = fs.readFileSync(path.join(ROOT, file), 'utf-8')
  const { data, content } = matter(raw)
  for (const key of ['title', 'description', 'duration', 'difficulty']) {
    if (!data[key]) fail(file, `frontmatter missing ${key}`)
  }

  try {
    const out = await compile(content, {
      remarkPlugins: [remarkMath, remarkGfm],
      rehypePlugins: [[rehypeKatex, { strict: false }]],
    })
    for (const m of out.messages) fail(file, `katex/mdx: ${m.reason}`)
  } catch (e) {
    fail(file, `compile: ${e.reason ?? e.message} (line ${e.line ?? e.place?.line ?? '?'})`)
  }

  // next-mdx-remote strips {…} expressions (blockJS), so braces outside code/math silently vanish.
  const prose = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/`[^`\n]*`/g, '')
    .replace(/\$[^$\n]+\$/g, '')
  for (const line of prose.split('\n')) {
    if (/[{}]/.test(line)) fail(file, `brace outside code/math will be stripped: ${line.trim().slice(0, 80)}`)
  }

  const charts = [...content.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)].map(m => m[1].trim())
  for (const [i, chart] of charts.entries()) {
    const encoded = Buffer.from(chart).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    let status = 0
    for (let attempt = 0; attempt < 3 && status !== 200 && status !== 400; attempt++) {
      try {
        status = (await fetch(`https://mermaid.ink/img/${encoded}`, { signal: AbortSignal.timeout(45000) })).status
      } catch { status = -1 }
    }
    if (status !== 200) fail(file, `mermaid #${i + 1} -> HTTP ${status}: ${chart.split('\n')[0]}`)
  }

  for (const m of content.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)\)|src="(\/[^"]+)"/g)) {
    const src = m[1] ?? m[2]
    if (!fs.existsSync(path.join(ROOT, 'public', src))) fail(file, `missing image ${src}`)
  }

  const kb = (Buffer.byteLength(raw) / 1024).toFixed(1)
  console.log(`${failures === before ? 'ok  ' : 'BAD '} ${file} (${kb} KB, ${charts.length} diagrams)`)
}

console.log(failures ? `\n${failures} problem(s)` : '\nAll clear')
process.exitCode = failures ? 1 : 0
