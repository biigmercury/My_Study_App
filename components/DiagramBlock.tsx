'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

interface DiagramBlockProps {
  chart: string
}

let counter = 0

export default function DiagramBlock({ chart }: DiagramBlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!ref.current) return
    let cancelled = false

    import('mermaid').then(async ({ default: mermaid }) => {
      if (cancelled) return

      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === 'dark' ? 'dark' : 'default',
        fontFamily: 'Inter, system-ui, sans-serif',
      })

      try {
        const id = `mermaid-${++counter}-${Date.now()}`
        const { svg } = await mermaid.render(id, chart.trim())
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg
        }
      } catch (e) {
        console.error('Mermaid render error:', e)
      }
    })

    return () => { cancelled = true }
  }, [chart, resolvedTheme])

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
    />
  )
}
