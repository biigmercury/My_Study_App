// Pre-render every mermaid block in content/ to public/diagrams/<hash>.jpg so lessons don't
// depend on mermaid.ink at page-load time. Re-run after adding or editing diagrams:
//   node scripts/render-diagrams.mjs
// Writes lib/diagram-manifest.json (hashes available locally); DiagramBlock falls back to
// mermaid.ink for any diagram not listed.
import fs from 'fs'
import path from 'path'
import { diagramHash, mermaidInkUrl } from '../lib/diagram-hash.mjs'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'public', 'diagrams')
const MANIFEST = path.join(ROOT, 'lib', 'diagram-manifest.json')
fs.mkdirSync(OUT_DIR, { recursive: true })

const mdxFiles = []
for (const course of fs.readdirSync(path.join(ROOT, 'content'))) {
  const dir = path.join(ROOT, 'content', course)
  if (!fs.statSync(dir).isDirectory()) continue
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.mdx')) mdxFiles.push(path.join(dir, f))
}

const wanted = new Map()
for (const file of mdxFiles) {
  const src = fs.readFileSync(file, 'utf-8')
  for (const m of src.matchAll(/```mermaid\r?\n([\s\S]*?)```/g)) {
    const chart = m[1].trim()
    wanted.set(diagramHash(chart), chart)
  }
}

let fetched = 0
let failed = 0
for (const [hash, chart] of wanted) {
  const target = path.join(OUT_DIR, `${hash}.jpg`)
  if (fs.existsSync(target)) continue
  let ok = false
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    try {
      const res = await fetch(mermaidInkUrl(chart), { signal: AbortSignal.timeout(60000) })
      if (res.ok) {
        fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()))
        ok = true
        fetched++
      } else if (res.status === 400) {
        break
      }
    } catch {}
  }
  if (!ok) {
    failed++
    console.log(`FAIL ${hash}: ${chart.split('\n')[0]}`)
  }
}

// Remove images no longer referenced by any lesson, then write the manifest.
for (const f of fs.readdirSync(OUT_DIR)) {
  if (!wanted.has(f.replace(/\.jpg$/, ''))) fs.unlinkSync(path.join(OUT_DIR, f))
}
const available = [...wanted.keys()].filter(h => fs.existsSync(path.join(OUT_DIR, `${h}.jpg`))).sort()
fs.writeFileSync(MANIFEST, JSON.stringify(available, null, 0) + '\n')

console.log(`${wanted.size} diagrams, ${fetched} newly rendered, ${failed} failed, ${available.length} available locally`)
