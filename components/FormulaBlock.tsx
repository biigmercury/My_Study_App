'use client'

import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface FormulaBlockProps {
  formula: string
  label?: string
  inline?: boolean
}

export default function FormulaBlock({ formula, label, inline = false }: FormulaBlockProps) {
  if (inline) {
    return <InlineMath math={formula} />
  }

  return (
    <div className="my-6 overflow-x-auto p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
      {label && (
        <p className="text-xs font-medium text-brand-royal dark:text-brand-sky mb-3 uppercase tracking-wide">
          {label}
        </p>
      )}
      <BlockMath math={formula} />
    </div>
  )
}
