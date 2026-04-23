interface DiagramBlockProps {
  chart: string
}

export default function DiagramBlock({ chart }: DiagramBlockProps) {
  if (!chart?.trim()) return null

  const encoded = Buffer.from(chart.trim())
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return (
    <div className="my-6 flex justify-center overflow-x-auto bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <img
        src={`https://mermaid.ink/img/${encoded}`}
        alt="Diagram"
        className="max-w-full h-auto"
      />
    </div>
  )
}
