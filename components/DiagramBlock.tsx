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

        // mermaid.run() is the canonical v11 API:
        // it reads el.textContent as the chart definition,
        // renders SVG into el in-place, bypasses DOMPurify on markers.
        const el = document.createElement('div')
        el.textContent = chart.trim()
        container.innerHTML = ''
        container.appendChild(el)

        await mermaid.run({ nodes: [el], suppressErrors: true })
      } catch (e) {
        console.error('Mermaid error:', e)
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
