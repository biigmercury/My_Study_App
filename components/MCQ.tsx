'use client'

import { Children, isValidElement, useState } from 'react'

type Part = React.ReactElement<{ 'data-mcq'?: string; 'data-correct'?: string; children: React.ReactNode }>

// Children are the tagged elements rendered by components/MCQParts (Option, Explain).
export default function MCQ({ question, children }: { question: string; children: React.ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement) as Part[]
  const options = items.filter(el => el.props['data-mcq'] === 'option').map(el => ({ correct: el.props['data-correct'] === 'true', body: el.props.children }))
  const explain = items.find(el => el.props['data-mcq'] === 'explain')
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const gotIt = answered && options[picked]?.correct

  return (
    <div className="my-4 rounded-xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 px-4 py-3">
      <p className="not-prose flex gap-2 text-[13.5px] font-semibold text-brand-navy dark:text-white leading-snug">
        <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-brand-gradient text-white text-[10px] font-bold flex items-center justify-center">Q</span>
        {question}
      </p>
      <div className="not-prose mt-3 grid gap-1.5">
        {options.map((opt, i) => {
          const isPicked = picked === i
          const showCorrect = answered && opt.correct
          const showWrong = isPicked && !opt.correct
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`text-left px-3 py-2 rounded-lg border text-[13px] leading-snug transition-colors ${
                showCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                  : showWrong
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                    : 'border-brand-navy/10 dark:border-brand-cyan/15 text-brand-navy/80 dark:text-white/80 hover:border-brand-royal'
              }`}
            >
              <span className="font-bold mr-1.5">{String.fromCharCode(65 + i)})</span>
              {opt.body}
              {showCorrect && <span className="ml-1.5">✓</span>}
              {showWrong && <span className="ml-1.5">✗</span>}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="mt-3 rounded-lg bg-brand-mist/50 dark:bg-brand-bg/50 px-3 py-1 text-[13px]">
          <p className={`not-prose pt-2 text-[12px] font-bold ${gotIt ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {gotIt ? 'Correct!' : 'Not quite.'}
          </p>
          {explain && <div className="[&>*:first-child]:mt-1 [&>*:last-child]:mb-2">{explain.props.children}</div>}
          <button type="button" onClick={() => setPicked(null)} className="not-prose mb-2 text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
            Try again ↺
          </button>
        </div>
      )}
    </div>
  )
}
