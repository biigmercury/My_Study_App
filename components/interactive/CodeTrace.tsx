'use client'

import { isValidElement, useMemo, useState } from 'react'

// Step-by-step execution tracer (Python Tutor style) for languages we can't run in the browser.
// Usage in MDX — a code fence plus a ```trace fence, one step per line:
//   line | variables | output | call stack | note
// "variables" is comma-separated name=value pairs (use ; inside values that need commas, e.g. arr=[1;2;3]),
// "output" is appended to the console (\n = newline), "call stack" frames are separated by > (outermost first).

interface Step {
  line: number
  vars: [string, string][]
  out: string
  stack: string[]
  note: string
}

function collect(node: React.ReactNode, out: { code?: string; lang?: string; trace?: string }) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (typeof props.className === 'string' && props.className.startsWith('language-') && typeof props.children === 'string') {
    const lang = props.className.replace('language-', '')
    if (lang === 'trace') out.trace = props.children
    else {
      out.code = props.children.replace(/\n$/, '')
      out.lang = lang
    }
    return
  }
  collect(props.children, out)
}

function parse(trace: string): Step[] {
  return trace
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const [line = '0', vars = '', out = '', stack = '', note = ''] = l.split('|').map(s => s.trim())
      return {
        line: parseInt(line, 10) || 0,
        vars: vars
          ? vars.split(',').map(p => {
              const i = p.indexOf('=')
              return [p.slice(0, i).trim(), p.slice(i + 1).trim().replace(/;/g, ',')] as [string, string]
            })
          : [],
        out: out.replace(/\\n/g, '\n').replace(/\\s/g, ' '),
        stack: stack ? stack.split('>').map(s => s.trim()) : [],
        note,
      }
    })
}

export default function CodeTrace({ title, children }: { title?: string; children: React.ReactNode }) {
  const { code, steps } = useMemo(() => {
    const found: { code?: string; lang?: string; trace?: string } = {}
    collect(children, found)
    return { code: (found.code ?? '').split('\n'), steps: parse(found.trace ?? '') }
  }, [children])
  const [i, setI] = useState(0)
  const step = steps[i]
  const output = steps
    .slice(0, i + 1)
    .map(s => s.out)
    .join('')
  // Values that changed since the previous step are highlighted.
  const prev = i > 0 ? new Map(steps[i - 1].vars) : new Map<string, string>()

  if (!steps.length) return null
  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🔍 {title ?? 'Step through the code'}</p>
        <p className="text-[10.5px] font-mono text-brand-navy/50 dark:text-white/45">
          Step {i + 1} / {steps.length}
        </p>
      </div>

      <div className="bg-[#021037] py-2 overflow-x-auto">
        {code.map((text, n) => {
          const active = step.line === n + 1
          return (
            <div key={n} className={`flex font-mono text-[12px] leading-[1.6] ${active ? 'bg-amber-400/25' : ''}`}>
              <span className={`w-8 shrink-0 text-right pr-2 select-none ${active ? 'text-amber-300 font-bold' : 'text-white/30'}`}>{active ? '▶' : n + 1}</span>
              <span className={`whitespace-pre pr-4 ${active ? 'text-white' : 'text-[#cbd5e1]'}`}>{text || ' '}</span>
            </div>
          )
        })}
      </div>

      {step.note && <p className="px-4 pt-2.5 text-[12.5px] leading-snug text-brand-navy/80 dark:text-white/80">{step.note}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3">
        <div className="rounded-lg bg-brand-soft dark:bg-brand-bg/60 p-2.5">
          <p className="text-[10px] font-semibold uppercase text-brand-navy/45 dark:text-white/40 mb-1.5">Variables</p>
          {step.vars.length === 0 ? (
            <p className="text-[11.5px] text-brand-navy/40 dark:text-white/35">(none yet)</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {step.vars.map(([k, v]) => (
                <span
                  key={k}
                  className={`font-mono text-[11.5px] px-2 py-0.5 rounded-md border ${prev.get(k) !== v ? 'bg-amber-100 dark:bg-amber-400/20 border-amber-400' : 'bg-white dark:bg-white/5 border-brand-navy/10 dark:border-white/10'}`}
                >
                  {k} = <b>{v}</b>
                </span>
              ))}
            </div>
          )}
          {step.stack.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase text-brand-navy/45 dark:text-white/40 mt-2.5 mb-1">Call stack (top = running now)</p>
              <div className="flex flex-col-reverse gap-1">
                {step.stack.map((f, k) => (
                  <span
                    key={k}
                    className={`font-mono text-[11px] px-2 py-0.5 rounded border ${k === step.stack.length - 1 ? 'bg-brand-gradient text-white border-transparent' : 'bg-white dark:bg-white/5 border-brand-navy/10 dark:border-white/10'}`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="rounded-lg bg-[#021037] p-2.5 min-h-[64px]">
          <p className="text-[10px] font-semibold uppercase text-white/40 mb-1">Console output</p>
          <pre className="font-mono text-[11.5px] text-green-200 whitespace-pre-wrap break-words">{output || ' '}</pre>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 pb-3">
        <button onClick={() => setI(0)} disabled={i === 0} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-brand-deep dark:text-brand-sky disabled:opacity-40">
          ⟲ Start
        </button>
        <button onClick={() => setI(v => Math.max(0, v - 1))} disabled={i === 0} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-brand-soft dark:bg-white/10 disabled:opacity-40">
          ← Back
        </button>
        <button onClick={() => setI(v => Math.min(steps.length - 1, v + 1))} disabled={i === steps.length - 1} className="ml-auto px-4 py-1.5 rounded-lg bg-brand-gradient text-white text-[12px] font-bold disabled:opacity-40">
          Next →
        </button>
      </div>
    </div>
  )
}
