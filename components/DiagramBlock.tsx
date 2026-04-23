'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

interface DiagramBlockProps {
  chart: string
}

export default function DiagramBlock({ chart }: DiagramBlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!ref.current || !chart) return
    const container = ref.current

    const render = async () => {
      try {
        const { default: mermaid } = await import('mermaid')

        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          fontFamily: 'Inter, system-ui, sans-serif',
        })

        // ID must start with a letter and contain no spaces
        const id = `md${Math.random().toString(36).slice(2, 10)}`
        const { svg } = await mermaid.render(id, chart.trim())
        container.innerHTML = svg
      } catch (e) {
        console.error('Mermaid render error:', e)
      }
    }

    render()
  }, [chart, resolvedTheme])

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
    />
  )
}
