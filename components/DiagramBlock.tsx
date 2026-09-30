import ZoomableImage from '@/components/ZoomableImage'
import { diagramHash, mermaidInkUrl } from '@/lib/diagram-hash.mjs'
import manifest from '@/lib/diagram-manifest.json'

interface DiagramBlockProps {
  chart: string
}

// Diagrams pre-rendered by scripts/render-diagrams.mjs are served locally; anything else
// falls back to mermaid.ink.
const localDiagrams = new Set<string>(manifest)

export default function DiagramBlock({ chart }: DiagramBlockProps) {
  if (!chart?.trim()) return null

  const hash = diagramHash(chart)
  const src = localDiagrams.has(hash) ? `/diagrams/${hash}.jpg` : mermaidInkUrl(chart)

  return (
    <div className="my-6 overflow-x-auto bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <ZoomableImage src={src} alt="Diagram" />
    </div>
  )
}
