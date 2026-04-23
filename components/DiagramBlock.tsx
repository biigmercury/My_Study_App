interface DiagramBlockProps {
  chart: string
}

function mermaidInkUrl(chart: string, theme: 'default' | 'dark'): string {
  const payload = JSON.stringify({ code: chart.trim(), mermaid: { theme } })
  // base64url encoding: safe for URL path segments (no +, /, or = characters)
  const encoded = Buffer.from(payload)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `https://mermaid.ink/img/${encoded}`
}

export default function DiagramBlock({ chart }: DiagramBlockProps) {
  if (!chart?.trim()) return null

  let lightUrl = ''
  let darkUrl = ''
  try {
    lightUrl = mermaidInkUrl(chart, 'default')
    darkUrl = mermaidInkUrl(chart, 'dark')
  } catch {
    return null
  }

  return (
    <div className="my-6 flex justify-center overflow-x-auto bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <picture>
        <source srcSet={darkUrl} media="(prefers-color-scheme: dark)" />
        <img src={lightUrl} alt="Diagram" className="max-w-full h-auto" loading="lazy" />
      </picture>
    </div>
  )
}
