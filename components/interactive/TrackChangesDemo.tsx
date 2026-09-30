'use client'

import { useMemo, useState } from 'react'

// Reviewing a document the Word way: tracked insertions, deletions and formatting from a reviewer,
// comments, the four display modes (Simple Markup, All Markup, No Markup, Original), Previous/Next,
// Accept/Reject (one or all), the Reviewing Pane, and your own edits recorded while Track Changes is on.

type Seg =
  | { k: 'text'; text: string }
  | { k: 'ins' | 'del'; id: number; text: string; who: string }
  | { k: 'fmt'; id: number; text: string; who: string; bold: boolean }
interface Comment {
  id: number
  anchor: string
  who: string
  text: string
}

const REVIEWER = 'Dr. Adeyemi'
const START: Seg[] = [
  { k: 'text', text: 'The project ' },
  { k: 'del', id: 1, text: 'was', who: REVIEWER },
  { k: 'ins', id: 2, text: 'has been', who: REVIEWER },
  { k: 'text', text: ' completed within the budget of ₦2.5 million' },
  { k: 'ins', id: 3, text: ' approved by the department', who: REVIEWER },
  { k: 'text', text: '. The team ' },
  { k: 'del', id: 4, text: 'were', who: REVIEWER },
  { k: 'ins', id: 5, text: 'was', who: REVIEWER },
  { k: 'text', text: ' made up of five students ' },
  { k: 'fmt', id: 6, text: 'from the Department of Computer Science', who: REVIEWER, bold: true },
  { k: 'text', text: '. Data ' },
  { k: 'del', id: 7, text: 'where', who: REVIEWER },
  { k: 'ins', id: 8, text: 'were', who: REVIEWER },
  { k: 'text', text: ' collected from 120 respondents in Ibadan and analysed with Microsoft Excel.' },
]
const COMMENTS: Comment[] = [{ id: 9, anchor: '₦2.5 million', who: REVIEWER, text: 'Please confirm this figure with the bursary before submission.' }]
const COLOR: Record<string, string> = { [REVIEWER]: '#C00000', You: '#2E75B6' }

type Mode = 'simple' | 'all' | 'none' | 'original'

export default function TrackChangesDemo() {
  const [segs, setSegs] = useState<Seg[]>(START)
  const [comments, setComments] = useState<Comment[]>(COMMENTS)
  const [mode, setMode] = useState<Mode>('all')
  const [tracking, setTracking] = useState(true)
  const [cur, setCur] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [nextId, setNextId] = useState(20)
  const [msg, setMsg] = useState<string | null>(null)

  const revs = useMemo(() => segs.filter((s): s is Exclude<Seg, { k: 'text' }> => s.k !== 'text'), [segs])
  const items = [...revs.map(r => ({ id: r.id, kind: r.k as string })), ...comments.map(c => ({ id: c.id, kind: 'comment' }))]

  const accept = (id: number) =>
    setSegs(ss =>
      ss.flatMap<Seg>(s => {
        if (s.k === 'text' || s.id !== id) return [s]
        if (s.k === 'ins') return [{ k: 'text', text: s.text }]
        if (s.k === 'del') return []
        return [{ k: 'fmt', text: s.text, bold: true, who: '', id: -s.id }]
      })
    )
  const reject = (id: number) =>
    setSegs(ss =>
      ss.flatMap<Seg>(s => {
        if (s.k === 'text' || s.id !== id) return [s]
        if (s.k === 'ins') return []
        if (s.k === 'del') return [{ k: 'text', text: s.text }]
        return [{ k: 'text', text: s.text }]
      })
    )
  const active = (id: number) => segs.some(s => s.k !== 'text' && s.id === id && (s.k !== 'fmt' || s.id > 0))
  const pending = items.filter(i => (i.kind === 'comment' ? true : active(i.id)))

  const move = (dir: 1 | -1) => {
    if (!pending.length) return setMsg('The document contains no comments or tracked changes.')
    const idx = pending.findIndex(p => p.id === cur)
    const n = idx < 0 ? (dir > 0 ? 0 : pending.length - 1) : (idx + dir + pending.length) % pending.length
    setCur(pending[n].id)
    setMsg(null)
  }
  const acceptCur = (all = false) => {
    if (all) {
      revs.filter(r => r.k !== 'fmt' || r.id > 0).forEach(r => accept(r.id))
      setCur(null)
      return setMsg('All changes accepted — the text is now final and the markup is gone (comments stay until you delete them).')
    }
    if (cur === null) return move(1)
    if (comments.some(c => c.id === cur)) return setMsg('That is a comment — use Delete comment instead.')
    accept(cur)
    move(1)
  }
  const rejectCur = (all = false) => {
    if (all) {
      revs.filter(r => r.k !== 'fmt' || r.id > 0).forEach(r => reject(r.id))
      setCur(null)
      return setMsg('All changes rejected — the text is back to the original.')
    }
    if (cur === null) return move(1)
    if (comments.some(c => c.id === cur)) return setMsg('That is a comment — use Delete comment instead.')
    reject(cur)
    move(1)
  }

  // your own edits: click a word to delete it, or add a sentence at the end
  const clickWord = (segIndex: number, wordStart: number, word: string) => {
    if (mode === 'original') return
    setSegs(ss => {
      const s = ss[segIndex]
      if (s.k !== 'text') return ss
      const before = s.text.slice(0, wordStart)
      const after = s.text.slice(wordStart + word.length)
      const mid: Seg[] = tracking ? [{ k: 'del', id: nextId, text: word, who: 'You' }] : []
      const out: Seg[] = [...ss.slice(0, segIndex), { k: 'text', text: before }, ...mid, { k: 'text', text: after }, ...ss.slice(segIndex + 1)]
      return out.filter(x => x.k !== 'text' || x.text !== '')
    })
    setNextId(n => n + 1)
    setMsg(tracking ? `Deleted “${word}” with Track Changes ON — it is marked, not gone, until someone accepts the deletion.` : `Deleted “${word}” with Track Changes OFF — it is simply gone; the reviewer will never know.`)
  }
  const addText = () => {
    if (!typed.trim()) return
    setSegs(ss => [...ss, tracking ? { k: 'ins', id: nextId, text: ' ' + typed.trim(), who: 'You' } : { k: 'text', text: ' ' + typed.trim() }])
    setNextId(n => n + 1)
    setTyped('')
  }

  const view = (s: Seg, i: number): React.ReactNode => {
    const isCur = s.k !== 'text' && cur === s.id
    const ring = isCur ? { outline: '2px solid #FFC000', borderRadius: 2 } : {}
    if (s.k === 'text' || (s.k === 'fmt' && s.id < 0)) {
      const bold = s.k === 'fmt'
      const words = s.text.split(/(\s+)/)
      let pos = 0
      return (
        <span key={i} style={{ fontWeight: bold ? 700 : undefined }}>
          {words.map((w, k) => {
            const start = pos
            pos += w.length
            if (!w.trim() || s.k !== 'text') return w
            const commented = comments.some(c => s.text.includes(c.anchor) && c.anchor.split(' ').includes(w))
            return (
              <span key={k} onClick={() => clickWord(i, start, w)} className="cursor-pointer hover:bg-yellow-100 rounded-sm" style={{ background: commented && mode === 'all' ? '#f5d9d9' : undefined }} title="Click to delete this word">
                {w}
              </span>
            )
          })}
        </span>
      )
    }
    const c = COLOR[s.who] ?? '#C00000'
    if (s.k === 'ins') {
      if (mode === 'original') return null
      if (mode === 'all')
        return (
          <span key={i} style={{ color: c, textDecoration: 'underline', ...ring }}>
            {s.text}
          </span>
        )
      return <span key={i} style={ring}>{s.text}</span>
    }
    if (s.k === 'del') {
      if (mode === 'none' || mode === 'simple') return isCur ? <span key={i} style={{ ...ring, padding: '0 1px' }} /> : null
      if (mode === 'original') return <span key={i}>{s.text}</span>
      return (
        <span key={i} style={{ color: c, textDecoration: 'line-through', ...ring }}>
          {s.text}
        </span>
      )
    }
    // formatting change
    return (
      <span key={i} style={{ fontWeight: mode === 'original' ? undefined : 700, ...ring, borderBottom: mode === 'all' ? `1px dotted ${c}` : undefined }}>
        {s.text}
      </span>
    )
  }

  const describe = (r: Exclude<Seg, { k: 'text' }>) => (r.k === 'ins' ? `Inserted: “${r.text.trim()}”` : r.k === 'del' ? `Deleted: “${r.text}”` : 'Formatted: Font: Bold')
  const btn = 'px-2 py-1 rounded border border-[#c6c6c6] bg-white text-[11.5px] text-[#222] hover:border-[#2B579A] disabled:opacity-40'
  const hasChanges = revs.some(r => r.k !== 'fmt' || r.id > 0)

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">✍️ Track Changes — reviewing Project.docx</p>
        <button
          onClick={() => {
            setSegs(START)
            setComments(COMMENTS)
            setCur(null)
            setMsg(null)
          }}
          className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky"
        >
          Reset
        </button>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-[#f3f3f3] text-[#222]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif' }}>
        <div className="px-2 py-1 text-[11px] font-semibold text-white" style={{ background: '#2B579A' }}>
          REVIEW tab
        </div>
        <div className="px-2 py-2 flex flex-wrap gap-1 items-center border-b border-[#d4d4d4] text-[11.5px]">
          <button onClick={() => setTracking(v => !v)} className={`${btn} ${tracking ? '!bg-[#dbe6f4] !border-[#2B579A]' : ''}`} title="Ctrl+Shift+E">
            Track Changes: {tracking ? 'ON' : 'OFF'}
          </button>
          <select aria-label="Display for Review" className="border border-[#c6c6c6] rounded bg-white px-1 py-0.5" value={mode} onChange={e => setMode(e.target.value as Mode)}>
            <option value="simple">Simple Markup</option>
            <option value="all">All Markup</option>
            <option value="none">No Markup</option>
            <option value="original">Original</option>
          </select>
          <button className={btn} onClick={() => move(-1)}>
            ◀ Previous
          </button>
          <button className={btn} onClick={() => move(1)}>
            Next ▶
          </button>
          <select
            aria-label="Accept"
            className="border border-[#c6c6c6] rounded bg-white px-1 py-0.5"
            value=""
            onChange={e => {
              if (e.target.value === 'one') acceptCur()
              if (e.target.value === 'all') acceptCur(true)
            }}
          >
            <option value="">✓ Accept ▾</option>
            <option value="one">Accept and Move to Next</option>
            <option value="all">Accept All Changes</option>
          </select>
          <select
            aria-label="Reject"
            className="border border-[#c6c6c6] rounded bg-white px-1 py-0.5"
            value=""
            onChange={e => {
              if (e.target.value === 'one') rejectCur()
              if (e.target.value === 'all') rejectCur(true)
            }}
          >
            <option value="">✕ Reject ▾</option>
            <option value="one">Reject and Move to Next</option>
            <option value="all">Reject All Changes</option>
          </select>
          <button
            className={btn}
            disabled={!comments.some(c => c.id === cur)}
            onClick={() => {
              setComments(cs => cs.filter(c => c.id !== cur))
              setCur(null)
            }}
          >
            Delete comment
          </button>
        </div>

        <div className="p-3 bg-[#dfdfdf]">
          <div className="bg-white shadow-sm px-4 py-4 flex gap-3">
            {mode === 'simple' && hasChanges && <div className="w-[3px] shrink-0 rounded" style={{ background: '#C00000' }} title="Changed lines — click to show All Markup" onClick={() => setMode('all')} />}
            <p className="flex-1 text-[14px] leading-relaxed" style={{ fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif' }}>
              {segs.map(view)}
            </p>
          </div>
          {mode === 'all' && (revs.some(r => r.k === 'fmt' && r.id > 0) || comments.length > 0) && (
            <div className="mt-2 space-y-1">
              {comments.map(c => (
                <div key={c.id} onClick={() => setCur(c.id)} className="bg-white border-l-4 px-2 py-1 text-[11.5px] cursor-pointer" style={{ borderColor: COLOR[c.who] ?? '#C00000', outline: cur === c.id ? '2px solid #FFC000' : undefined }}>
                  💬 <b>{c.who}</b> on “{c.anchor}”: {c.text}
                </div>
              ))}
              {revs
                .filter(r => r.k === 'fmt' && r.id > 0)
                .map(r => (
                  <div key={r.id} className="bg-white border-l-4 px-2 py-1 text-[11.5px]" style={{ borderColor: COLOR[r.who] ?? '#C00000' }}>
                    <b>{r.who}</b> Formatted: Font: Bold
                  </div>
                ))}
            </div>
          )}
          {mode === 'simple' && comments.length > 0 && <p className="mt-2 text-[11px] text-[#555]">💬 {comments.length} comment{comments.length > 1 ? 's' : ''} — switch to All Markup to read them.</p>}
        </div>

        <div className="px-3 py-2 border-t border-[#d4d4d4] bg-white text-[11.5px]">
          <p className="font-semibold mb-1">
            Reviewing Pane — {pending.length} revision{pending.length === 1 ? '' : 's'}
          </p>
          <ul className="space-y-0.5 max-h-28 overflow-auto">
            {revs
              .filter(r => r.k !== 'fmt' || r.id > 0)
              .map(r => (
                <li key={r.id} onClick={() => setCur(r.id)} className="cursor-pointer" style={{ fontWeight: cur === r.id ? 700 : 400 }}>
                  <span style={{ color: COLOR[r.who] }}>{r.who}</span> {describe(r)}
                </li>
              ))}
            {comments.map(c => (
              <li key={c.id} onClick={() => setCur(c.id)} className="cursor-pointer" style={{ fontWeight: cur === c.id ? 700 : 400 }}>
                <span style={{ color: COLOR[c.who] }}>{c.who}</span> Comment: {c.text}
              </li>
            ))}
            {!pending.length && <li className="text-[#666]">No revisions — the document is clean.</li>}
          </ul>
        </div>
        <div className="px-3 py-2 border-t border-[#d4d4d4] flex flex-wrap gap-1.5 items-center text-[11.5px]">
          <span>Your edit:</span>
          <input value={typed} onChange={e => setTyped(e.target.value)} placeholder="text to add at the end" className="flex-1 min-w-[140px] border border-[#c6c6c6] rounded px-1.5 py-0.5 bg-white" />
          <button className={btn} onClick={addText}>
            Type it
          </button>
          <span className="w-full text-[#666]">…or click any black word in the document to delete it.</span>
        </div>
      </div>
      {msg && <p className="mx-3 mb-3 -mt-1 px-3 py-2 rounded-lg text-[12px] bg-brand-sky/10 border border-brand-sky/30">{msg}</p>}
    </div>
  )
}
