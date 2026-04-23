// Server component — no client JS, no eval, no CSP issues.
// Renders diagrams via mermaid.ink image service.

interface DiagramBlockProps {
  chart: string
}

function encodedUrl(chart: string, theme: 'default' | 'dark') {
  const payload = JSON.stringify({ code: chart.trim(), mermaid: { theme } })
  const encoded = Buffer.from(payload).toString('base64')
  return `https://mermaid.ink/img/${encoded}`
}

export default function DiagramBlock({ chart }: DiagramBlockProps) {
  const lightUrl = encodedUrl(chart, 'default')
  const darkUrl = encodedUrl(chart, 'dark')

  return (
    <div className="my-6 flex justify-center overflow-x-auto bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <picture>
        {/* browsers that match prefers-color-scheme:dark get the dark-themed diagram */}
        <source srcSet={darkUrl} media="(prefers-color-scheme: dark)" />
        <img
          src={lightUrl}
          alt="Diagram"
          className="max-w-full h-auto"
          loading="lazy"
        />
      </picture>
    </div>
  )
}
