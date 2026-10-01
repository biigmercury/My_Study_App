'use client'

import { isValidElement, useMemo, useState } from 'react'

// Labelled specimen document (letter, memo, minutes…) from a ```doc fence. Learners tap any block
// to see what that part is called and the rule for it; Quiz mode hides the labels and asks them to
// name each part. Fence format:
//   @part addr = Writer's address :: Top right; never includes the writer's name
//   addr>: 12 Awolowo Hall,          ← key, optional alignment (> right, ^ centre), colon, text
//   -: unlabelled line               ← "-" = not part of the quiz
//   (blank line) or "key:" alone   ← vertical space; consecutive lines with one key form one block
// Inline **bold** and __underline__ are supported.

function collect(node: React.ReactNode, out: string[]) {
  if (Array.isArray(node)) return node.forEach(n => collect(n, out))
  if (!isValidElement(node)) return
  const props = node.props as { className?: unknown; children?: React.ReactNode }
  if (props.className === 'language-doc' && typeof props.children === 'string') {
    out.push(props.children)
    return
  }
  collect(props.children, out)
}

type Part = { key: string; label: string; why: string; color: string }
type Line = { text: string; align: 'left' | 'right' | 'center' } | null
type Block = { key: string; lines: Line[] }

const PALETTE = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#ec4899', '#6366f1', '#84cc16', '#f97316', '#06b6d4', '#a855f7']

function inline(text: string) {
  const out: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*|__(.+?)__/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(m[1] !== undefined ? <b key={m.index}>{inline(m[1])}</b> : <u key={m.index}>{inline(m[2])}</u>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export default function DocAnatomy({ title, children }: { title?: string; children?: React.ReactNode }) {
  const { parts, blocks } = useMemo(() => {
    const out: string[] = []
    collect(children, out)
    const parts: Record<string, Part> = {}
    const raw: { key: string; line: Line }[] = []
    for (const l of out.join('\n').replace(/\r/g, '').split('\n')) {
      const p = /^\s*@part\s+([\w-]+)\s*=\s*(.*?)(?:\s*::\s*(.*))?$/.exec(l)
      if (p) {
        parts[p[1]] = { key: p[1], label: p[2], why: p[3] ?? '', color: PALETTE[Object.keys(parts).length % PALETTE.length] }
        continue
      }
      if (!l.trim()) {
        raw.push({ key: '', line: null })
        continue
      }
      const m = /^([\w-]+)([>^]?):\s?(.*)$/.exec(l)
      if (m) raw.push({ key: m[1], line: { text: m[3], align: m[2] === '>' ? 'right' : m[2] === '^' ? 'center' : 'left' } })
      else raw.push({ key: '-', line: { text: l, align: 'left' } })
    }
    // Group consecutive lines that share a key; a blank line between two lines of the same key stays inside the block.
    const blocks: Block[] = []
    raw.forEach((r, i) => {
      const cur = blocks[blocks.length - 1]
      if (r.line === null) {
        const next = raw.slice(i + 1).find(x => x.line !== null)
        if (cur && next && next.key === cur.key && cur.key !== '-') cur.lines.push(null)
        else blocks.push({ key: '', lines: [null] })
        return
      }
      if (cur && cur.key === r.key) cur.lines.push(r.line)
      else blocks.push({ key: r.key, lines: [r.line] })
    })
    while (blocks.length && blocks[blocks.length - 1].key === '') blocks.pop()
    return { parts, blocks }
  }, [children])

  const [mode, setMode] = useState<'explore' | 'quiz'>('explore')
  const [open, setOpen] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const quizBlocks = blocks.map((b, i) => (parts[b.key] ? i : -1)).filter(i => i >= 0)
  const right = quizBlocks.filter(i => answers[i] === blocks[i].key).length
  const partList = Object.values(parts)

  const switchMode = (m: 'explore' | 'quiz') => {
    setMode(m)
    setOpen(null)
    setAnswers({})
  }

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">📄 {title ?? 'Anatomy of a document'}</p>
        <div className="flex rounded-lg border border-brand-navy/15 dark:border-white/20 overflow-hidden text-[11px] font-semibold">
          {(['explore', 'quiz'] as const).map(m => (
            <button key={m} onClick={() => switchMode(m)} className={`px-2.5 py-1 ${mode === m ? 'bg-brand-deep text-white dark:bg-brand-sky dark:text-brand-navy' : ''}`}>
              {m === 'explore' ? 'Explore' : 'Quiz me'}
            </button>
          ))}
        </div>
      </div>
      <p className="px-4 pt-1 text-[12px] text-brand-navy/65 dark:text-white/65">
        {mode === 'explore' ? 'Tap any part of the document to see what it is called and the rule for it.' : `Tap each coloured block and name the part. ${right} / ${Object.keys(answers).length} correct · ${quizBlocks.length - Object.keys(answers).length} left`}
      </p>

      <div className="p-3">
        <div className="rounded-lg border border-black/10 bg-[#fffdf7] text-[#1f2937] shadow-sm px-3 py-4 sm:px-6 font-serif text-[13px] leading-snug">
          {blocks.map((b, i) => {
            const part = parts[b.key]
            if (!part)
              return (
                <div key={i}>
                  {b.lines.map((l, k) => (l?.text ? <p key={k} style={{ textAlign: l.align }} className="whitespace-pre-wrap">{inline(l.text)}</p> : <div key={k} className="h-3" />))}
                </div>
              )
            const ans = answers[i]
            const isOpen = open === i
            const showLabel = mode === 'explore' || ans !== undefined
            return (
              <div key={i} className="relative">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="block w-full text-left rounded-md px-1.5 py-0.5 -mx-1.5 transition hover:bg-black/[0.04]"
                  style={{ boxShadow: `inset 3px 0 0 ${part.color}`, background: isOpen ? `${part.color}14` : undefined }}
                >
                  {showLabel && (
                    <span className="float-right ml-2 mt-0.5 rounded px-1.5 py-px font-sans text-[10px] font-bold text-white" style={{ background: part.color }}>
                      {mode === 'quiz' ? (ans === b.key ? '✓ ' : '✗ ') : ''}
                      {part.label}
                    </span>
                  )}
                  {b.lines.map((l, k) => (l?.text ? <p key={k} style={{ textAlign: l.align }} className="whitespace-pre-wrap pl-1">{inline(l.text)}</p> : <div key={k} className="h-3" />))}
                </button>
                {isOpen && mode === 'explore' && (
                  <div className="my-1.5 rounded-lg border px-3 py-2 font-sans text-[12.5px] text-brand-navy" style={{ borderColor: part.color, background: `${part.color}12` }}>
                    <b>{part.label}.</b> {part.why}
                  </div>
                )}
                {isOpen && mode === 'quiz' && ans === undefined && (
                  <div className="my-1.5 flex flex-wrap gap-1.5 font-sans">
                    {partList.map(p => (
                      <button
                        key={p.key}
                        onClick={() => setAnswers(a => ({ ...a, [i]: p.key }))}
                        className="rounded-lg border border-brand-navy/20 bg-white px-2 py-1 text-[11.5px] font-semibold text-brand-navy hover:bg-brand-sky/15"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
                {isOpen && mode === 'quiz' && ans !== undefined && (
                  <div className={`my-1.5 rounded-lg border px-3 py-2 font-sans text-[12.5px] ${ans === b.key ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-rose-300 bg-rose-50 text-rose-900'}`}>
                    <b>{ans === b.key ? '✓ Correct' : `✗ Not "${parts[ans]?.label}"`}</b> — this is the <b>{part.label}</b>. {part.why}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {mode === 'quiz' && Object.keys(answers).length === quizBlocks.length && quizBlocks.length > 0 && (
          <div className="mt-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-100">
            Finished — {right} of {quizBlocks.length} parts named correctly.{' '}
            <button onClick={() => switchMode('quiz')} className="font-semibold underline">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
