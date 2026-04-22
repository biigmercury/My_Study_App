'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

interface DiagramBlockProps {
  chart: string
}

let diagramCounter = 0

export default function DiagramBlock({ chart }: DiagramBlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const [id] = useState(() => `mermaid-${++diagramCounter}`)

  useEffect(() => {
    if (!ref.current) return

    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: resolvedTheme === 'dark' ? 'dark' : 'default',
        fontFamily: 'Inter, system-ui, sans-serif',
      })

      ref.current!.innerHTML = `<div class="mermaid" id="${id}">${chart}</div>`
      mermaid.run({ querySelector: `#${id}` }).catch(console.error)
    })
  }, [chart, resolvedTheme, id])

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
    />
  )
}
