'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// A small Word-like document for practising the Font and Paragraph groups on real selected text:
// bold/italic/underline/strikethrough, subscript/superscript, change case, font, size, colour,
// highlight, clear formatting, format painter, alignment, line and paragraph spacing, indents
// (with a draggable ruler: first-line, hanging, left and right indent markers), bullets, numbering,
// sort and Show/Hide ¶. Built-in tasks check themselves.

interface CharFmt {
  b?: boolean
  i?: boolean
  u?: boolean
  s?: boolean
  sub?: boolean
  sup?: boolean
  font?: string
  size?: number
  color?: string
  hl?: string
}
interface Run {
  text: string
  f: CharFmt
}
interface ParaFmt {
  align: 'left' | 'center' | 'right' | 'justify'
  line: number
  before: number
  after: number
  left: number
  right: number
  special: 'none' | 'first' | 'hanging'
  by: number
  list?: 'bullet' | 'number'
}
interface Para {
  runs: Run[]
  p: ParaFmt
}
interface Pos {
  pi: number
  off: number
}

const NORMAL: ParaFmt = { align: 'left', line: 1.08, before: 0, after: 8, left: 0, right: 0, special: 'none', by: 0 }
const FONTS = ['Calibri', 'Cambria', 'Times New Roman', 'Arial', 'Courier New', 'Comic Sans MS']
const FONT_CSS: Record<string, string> = {
  Calibri: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif',
  Cambria: 'Cambria, Caladea, Georgia, serif',
  'Times New Roman': '"Times New Roman", Times, serif',
  Arial: 'Arial, Helvetica, sans-serif',
  'Courier New': '"Courier New", Courier, monospace',
  'Comic Sans MS': '"Comic Sans MS", "Comic Neue", cursive',
}
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28]
const COLORS: [string, string][] = [
  ['', 'Automatic'],
  ['#C00000', 'Dark Red'],
  ['#2E75B6', 'Blue'],
  ['#00B050', 'Green'],
  ['#7030A0', 'Purple'],
]
const HIGHLIGHTS: [string, string][] = [
  ['', 'No Colour'],
  ['#FFFF00', 'Yellow'],
  ['#00FF00', 'Bright Green'],
  ['#00FFFF', 'Turquoise'],
]
// Fonts are shown at 1.25 px per point (about 100% zoom) and centimetres at the same scale, so
// indents look the right size next to the text; the page is as wide as the screen allows.
const PX_PT = 1.25
const PX_CM = PX_PT * 28.3465
const PAGE_PAD = 18
const px = (cm: number) => `${(cm * PX_CM).toFixed(2)}px`

const para = (text: string, p: Partial<ParaFmt> = {}): Para => ({ runs: [{ text, f: {} }], p: { ...NORMAL, ...p } })
const INITIAL: Para[] = [
  para('My Mud House'),
  para('I made myself a mud house, as perfect as could be. I was pleased with myself. I thought I’d keep it and sleep in it. I also made some mud beds and a pillow for myself. Then last night it rained and the house disappeared.'),
  para('Water is H2O and we live in the 21st century. THIS SENTENCE WAS TYPED WITH CAPS LOCK ON BY MISTAKE.'),
  para('Yam'),
  para('Beans'),
  para('Rice'),
  para('Garri'),
]

const same = (a: CharFmt, b: CharFmt) => JSON.stringify(a) === JSON.stringify(b)

function textNodes(el: Node): Text[] {
  const out: Text[] = []
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n as Text)
  return out
}
const textOf = (p: Para) => p.runs.map(r => r.text).join('')

function normalize(runs: Run[]): Run[] {
  const out: Run[] = []
  for (const r of runs) {
    if (!r.text) continue
    const last = out[out.length - 1]
    if (last && same(last.f, r.f)) last.text += r.text
    else out.push({ text: r.text, f: { ...r.f } })
  }
  return out.length ? out : [{ text: '', f: runs[0]?.f ?? {} }]
}

// Apply fn to the characters [a, b) of a paragraph.
function mapRange(p: Para, a: number, b: number, fn: (r: Run) => Run): Para {
  const out: Run[] = []
  let pos = 0
  for (const r of p.runs) {
    const s = pos
    const e = pos + r.text.length
    pos = e
    if (e <= a || s >= b) {
      out.push(r)
      continue
    }
    const x = Math.max(a, s) - s
    const y = Math.min(b, e) - s
    if (x > 0) out.push({ text: r.text.slice(0, x), f: r.f })
    out.push(fn({ text: r.text.slice(x, y), f: { ...r.f } }))
    if (y < r.text.length) out.push({ text: r.text.slice(y), f: r.f })
  }
  return { ...p, runs: normalize(out) }
}

function caseChange(text: string, mode: string, atSentenceStart: boolean) {
  switch (mode) {
    case 'upper':
      return text.toUpperCase()
    case 'lower':
      return text.toLowerCase()
    case 'title':
      return text.toLowerCase().replace(/(^|[\s(“"-])(\p{L})/gu, (_, a, c) => a + c.toUpperCase())
    case 'toggle':
      return [...text].map(c => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('')
    default: {
      let start = atSentenceStart
      let out = ''
      for (const c of text.toLowerCase()) {
        if (start && /\p{L}/u.test(c)) {
          out += c.toUpperCase()
          start = false
        } else out += c
        if (/[.!?]/.test(c)) start = true
      }
      return out
    }
  }
}

export default function WordFormatLab() {
  const [doc, setDoc] = useState<Para[]>(INITIAL)
  const [hist, setHist] = useState<Para[][]>([])
  const [marks, setMarks] = useState(false)
  const [sel, setSel] = useState<{ a: Pos; b: Pos } | null>(null)
  const [painter, setPainter] = useState<{ f: CharFmt; p: ParaFmt } | null>(null)
  const [showPara, setShowPara] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const docRef = useRef<HTMLDivElement>(null)
  const rulerRef = useRef<HTMLDivElement>(null)
  const selRef = useRef(sel)
  selRef.current = sel
  const restore = useRef<{ a: Pos; b: Pos } | null>(null)

  // put the browser selection back after a re-render replaced the text nodes
  useLayoutEffect(() => {
    const want = restore.current
    restore.current = null
    if (!want || !docRef.current) return
    const point = (pos: Pos): [Node, number] | null => {
      const pEl = docRef.current!.querySelector(`[data-pi="${pos.pi}"]`)
      if (!pEl) return null
      const spans = [...pEl.querySelectorAll('[data-ro]')] as HTMLElement[]
      for (const sp of spans) {
        const ro = Number(sp.dataset.ro)
        const len = sp.textContent?.length ?? 0
        if (pos.off <= ro + len) {
          let rest = Math.max(0, pos.off - ro)
          const nodes = textNodes(sp)
          for (const t of nodes) {
            if (rest <= t.length) return [t, rest]
            rest -= t.length
          }
        }
      }
      const last = spans[spans.length - 1]
      const tn = last ? textNodes(last) : []
      return tn.length ? [tn[tn.length - 1], tn[tn.length - 1].length] : null
    }
    const a = point(want.a)
    const b = point(want.b)
    if (a && b) window.getSelection()?.setBaseAndExtent(a[0], a[1], b[0], b[1])
  })

  const commit = (next: Para[]) => {
    setHist(h => [...h.slice(-40), doc])
    setDoc(next)
    if (selRef.current) restore.current = selRef.current
  }
  const undo = () => {
    if (!hist.length) return
    setDoc(hist[hist.length - 1])
    setHist(h => h.slice(0, -1))
  }

  // ---------- selection mapping ----------
  const pointToPos = (node: Node, offset: number): Pos | null => {
    const el = (node.nodeType === 3 ? node.parentElement : (node as Element)) as HTMLElement | null
    const pEl = el?.closest('[data-pi]') as HTMLElement | null
    if (!pEl || !docRef.current?.contains(pEl)) return null
    const pi = Number(pEl.dataset.pi)
    const run = el?.closest('[data-ro]') as HTMLElement | null
    if (run && node.nodeType === 3) {
      let before = 0
      for (const t of textNodes(run)) {
        if (t === node) break
        before += t.length
      }
      return { pi, off: Number(run.dataset.ro) + before + offset }
    }
    // element boundary: count characters of runs before the child index
    let off = 0
    const kids = [...pEl.querySelectorAll('[data-ro]')] as HTMLElement[]
    if (el === pEl) {
      const child = pEl.childNodes[offset] as HTMLElement | undefined
      for (const k of kids) {
        if (child && (k === child || child.contains?.(k))) break
        off = Number(k.dataset.ro) + (k.textContent?.length ?? 0)
      }
      return { pi, off }
    }
    if (run) return { pi, off: Number(run.dataset.ro) + (offset > 0 ? run.textContent?.length ?? 0 : 0) }
    return { pi, off: textOf(doc[pi]).length }
  }

  useEffect(() => {
    const onSel = () => {
      const s = window.getSelection()
      if (!s || !s.rangeCount || !docRef.current) return
      const r = s.getRangeAt(0)
      if (!docRef.current.contains(r.startContainer) || !docRef.current.contains(r.endContainer)) return
      const a = pointToPos(r.startContainer, r.startOffset)
      const b = pointToPos(r.endContainer, r.endOffset)
      if (a && b) setSel({ a, b })
    }
    document.addEventListener('selectionchange', onSel)
    return () => document.removeEventListener('selectionchange', onSel)
  })

  const range = () => {
    const sel = selRef.current
    if (!sel) return null
    const [a, b] = sel.a.pi < sel.b.pi || (sel.a.pi === sel.b.pi && sel.a.off <= sel.b.off) ? [sel.a, sel.b] : [sel.b, sel.a]
    return { a, b, collapsed: a.pi === b.pi && a.off === b.off }
  }

  // character formatting: selection, or the whole paragraph when nothing is selected
  const applyChar = (fn: (f: CharFmt) => CharFmt, label?: string) => {
    const r = range()
    if (!r) return setNote('Click in the document or select some text first.')
    const next = doc.map((p, pi) => {
      if (pi < r.a.pi || pi > r.b.pi) return p
      const len = textOf(p).length
      const a = r.collapsed ? 0 : pi === r.a.pi ? r.a.off : 0
      const b = r.collapsed ? len : pi === r.b.pi ? r.b.off : len
      return mapRange(p, a, b, run => ({ ...run, f: fn(run.f) }))
    })
    commit(next)
    if (r.collapsed) setNote(`${label ?? 'Formatting'} applied to the whole paragraph because nothing was selected — drag across text to format just part of it.`)
    else setNote(null)
  }
  const firstFmt = (): CharFmt => {
    const r = range()
    if (!r) return {}
    const p = doc[r.a.pi]
    let pos = 0
    for (const run of p.runs) {
      if (r.a.off < pos + run.text.length || run === p.runs[p.runs.length - 1]) return run.f
      pos += run.text.length
    }
    return {}
  }
  const cur = firstFmt()
  const toggle = (k: 'b' | 'i' | 'u' | 's', label: string) => applyChar(f => ({ ...f, [k]: !cur[k] }), label)
  const script = (k: 'sub' | 'sup') => applyChar(f => ({ ...f, sub: k === 'sub' ? !cur.sub : false, sup: k === 'sup' ? !cur.sup : false }), k === 'sub' ? 'Subscript' : 'Superscript')

  const changeCase = (mode: string) => {
    const r = range()
    if (!r) return
    const next = doc.map((p, pi) => {
      if (pi < r.a.pi || pi > r.b.pi) return p
      const text = textOf(p)
      const a = r.collapsed ? 0 : pi === r.a.pi ? r.a.off : 0
      const b = r.collapsed ? text.length : pi === r.b.pi ? r.b.off : text.length
      const before = text.slice(0, a).trimEnd()
      const startOfSentence = !before || /[.!?]$/.test(before)
      const replaced = caseChange(text.slice(a, b), mode, startOfSentence)
      let k = 0
      return mapRange(p, a, b, run => {
        const t = replaced.slice(k, k + run.text.length)
        k += run.text.length
        return { ...run, text: t }
      })
    })
    commit(next)
  }

  const paras = () => {
    const r = range()
    if (!r) return []
    return doc.map((_, i) => i).filter(i => i >= r.a.pi && i <= r.b.pi)
  }
  const applyPara = (fn: (p: ParaFmt) => ParaFmt) => {
    const idx = paras()
    if (!idx.length) return setNote('Click in a paragraph first.')
    commit(doc.map((p, i) => (idx.includes(i) ? { ...p, p: fn({ ...p.p }) } : p)))
  }
  const curPara = doc[range()?.a.pi ?? 0]?.p ?? NORMAL

  const toggleList = (kind: 'bullet' | 'number') =>
    applyPara(p => (p.list === kind ? { ...p, list: undefined, left: 0, special: 'none', by: 0 } : { ...p, list: kind, left: 1.27, special: 'hanging', by: 0.63 }))

  const sort = (desc: boolean) => {
    const idx = paras()
    if (idx.length < 2) return setNote('Select two or more paragraphs (e.g. the four foods) before sorting.')
    const picked = idx.map(i => doc[i])
    const numeric = picked.every(p => !isNaN(parseFloat(textOf(p))))
    picked.sort((x, y) => {
      const a = textOf(x)
      const b = textOf(y)
      const d = numeric ? parseFloat(a) - parseFloat(b) : a.localeCompare(b, undefined, { sensitivity: 'base' })
      return desc ? -d : d
    })
    const next = [...doc]
    idx.forEach((i, k) => (next[i] = picked[k]))
    commit(next)
    setNote(`Sorted ${idx.length} paragraphs ${desc ? 'Z → A (descending)' : 'A → Z (ascending)'} by ${numeric ? 'number' : 'text'}.`)
  }

  const clearFormatting = () => {
    applyChar(() => ({}), 'Clear All Formatting')
    applyPara(() => ({ ...NORMAL }))
  }

  const pickPainter = () => {
    const r = range()
    if (!r) return setNote('Click in formatted text first, then Format Painter, then drag across the target text.')
    setPainter({ f: firstFmt(), p: { ...doc[r.a.pi].p } })
    setNote('Format Painter is on — now drag across the text you want to format (the pointer is a paintbrush).')
  }
  const onDocMouseUp = () => {
    if (!painter) return
    requestAnimationFrame(() => {
      const r = range()
      if (!r || r.collapsed) return
      const next = doc.map((p, pi) => {
        if (pi < r.a.pi || pi > r.b.pi) return p
        const len = textOf(p).length
        const a = pi === r.a.pi ? r.a.off : 0
        const b = pi === r.b.pi ? r.b.off : len
        return { ...mapRange(p, a, b, run => ({ ...run, f: { ...painter.f } })), p: { ...painter.p } }
      })
      commit(next)
      setPainter(null)
      setNote('Formatting copied with Format Painter.')
    })
  }

  // ---------- ruler dragging ----------
  const cmFromX = (clientX: number) => {
    const el = rulerRef.current
    if (!el) return { cm: 0, width: 10 }
    const r = el.getBoundingClientRect()
    return { cm: Math.round(((clientX - r.left) / PX_CM) * 4) / 4, width: r.width / PX_CM }
  }
  const dragMarker = (kind: 'first' | 'hanging' | 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault()
    const idx = paras().length ? paras() : [0]
    const base = doc
    const startP = { ...doc[idx[0]].p }
    let moved = false
    const firstLine = (p: ParaFmt) => p.left + (p.special === 'first' ? p.by : p.special === 'hanging' ? -p.by : 0)
    const others = (p: ParaFmt) => p.left
    const mv = (ev: PointerEvent) => {
      moved = true
      const { cm: raw, width } = cmFromX(ev.clientX)
      const cm = Math.max(-0.5, Math.min(width - 1, raw))
      let f = firstLine(startP)
      let o = others(startP)
      let right = startP.right
      if (kind === 'first') f = cm
      else if (kind === 'hanging') o = cm
      else if (kind === 'left') {
        const d = cm - o
        f += d
        o += d
      } else right = Math.max(-0.5, Math.min(width - 1, Math.round((width - raw) * 4) / 4))
      const p: ParaFmt = { ...startP, left: o, right, special: f > o ? 'first' : f < o ? 'hanging' : 'none', by: Math.abs(f - o) }
      setDoc(base.map((q, i) => (idx.includes(i) ? { ...q, p: { ...q.p, left: p.left, right: p.right, special: p.special, by: p.by } } : q)))
    }
    const keepSel = selRef.current
    const up = () => {
      window.removeEventListener('pointermove', mv)
      window.removeEventListener('pointerup', up)
      if (moved) setHist(h => [...h.slice(-40), base])
      if (keepSel) {
        restore.current = keepSel
        setSel({ ...keepSel })
      }
    }
    window.addEventListener('pointermove', mv)
    window.addEventListener('pointerup', up)
  }

  // ---------- tasks ----------
  const find = (s: string) => doc.find(p => textOf(p).includes(s))
  const charAt = (p: Para | undefined, needle: string, k: number): CharFmt | null => {
    if (!p) return null
    const t = textOf(p)
    const at = t.indexOf(needle)
    if (at < 0) return null
    let pos = 0
    for (const r of p.runs) {
      if (at + k < pos + r.text.length) return r.f
      pos += r.text.length
    }
    return null
  }
  const title = find('Mud House')
  const poem = find('as perfect as')
  const foods = doc.filter(p => ['Yam', 'Beans', 'Rice', 'Garri'].includes(textOf(p).trim()))
  const foodIdx = doc.map((p, i) => (foods.includes(p) ? i : -1)).filter(i => i >= 0)
  const tasks: [boolean, string][] = [
    [!!title && title.p.align === 'center' && title.runs.every(r => r.f.b) && (title.runs[0].f.size ?? 11) >= 14, 'Title: bold, centred, 14 pt or larger'],
    [!!poem && poem.p.align === 'justify' && poem.p.line === 1.5, 'Paragraph 2: Justify and 1.5 line spacing'],
    [!!poem && poem.p.special === 'first' && poem.p.by >= 1, 'Paragraph 2: first-line indent of at least 1 cm (drag the top ▽ marker or use Paragraph…)'],
    [!!charAt(find('H2O'), 'H2O', 1)?.sub && !charAt(find('H2O'), 'H2O', 0)?.sub, 'Make only the 2 in H2O subscript'],
    [!!charAt(find('21st'), '21st', 2)?.sup && !!charAt(find('21st'), '21st', 3)?.sup && !charAt(find('21st'), '21st', 1)?.sup, 'Make the “st” in 21st superscript'],
    [!!find('This sentence was typed with caps lock on by mistake.'), 'Fix the CAPS LOCK sentence with Change Case → Sentence case'],
    [foods.length === 4 && foods.every(p => p.p.list === 'bullet') && foodIdx.every((v, i) => i === 0 || v === foodIdx[i - 1] + 1) && foods.map(textOf).join() === 'Beans,Garri,Rice,Yam', 'Bullet the four foods and sort them A → Z'],
  ]
  const done = tasks.filter(t => t[0]).length

  // ---------- render ----------
  let number = 0
  const btn = (on?: boolean) => `h-7 min-w-7 px-1.5 rounded border text-[12px] text-[#222] ${on ? 'border-[#2B579A] bg-[#dbe6f4]' : 'border-transparent hover:border-[#c6c6c6] hover:bg-white'}`
  const selCls = 'h-7 rounded border border-[#c6c6c6] bg-white px-0.5 text-[12px] text-[#222]'
  const keep = (e: React.MouseEvent) => e.preventDefault()
  const group = (label: string, body: React.ReactNode) => (
    <div className="flex flex-col items-center shrink-0 border-r border-[#e1e1e1] pr-2 mr-2 last:border-r-0">
      <div className="flex items-center gap-0.5 flex-nowrap">{body}</div>
      <span className="text-[9.5px] text-[#777] mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  )
  const P = curPara
  const firstCm = P.left + (P.special === 'first' ? P.by : P.special === 'hanging' ? -P.by : 0)
  const otherCm = P.left

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">📝 Word formatting lab</p>
        <div className="flex gap-3 text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
          <button onClick={undo} disabled={!hist.length} className="disabled:opacity-40">
            ↶ Undo
          </button>
          <button
            onClick={() => {
              setDoc(INITIAL)
              setHist([])
              setNote(null)
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-[#f3f3f3]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif', color: '#222' }}>
        <div className="flex items-center gap-2 px-2 h-7 text-white text-[12px]" style={{ background: '#2B579A' }}>
          <span className="flex-1 text-center">MudHouse.docx - Word</span>
        </div>
        <div className="flex overflow-x-auto px-2 py-1.5 border-b border-[#d4d4d4]" style={{ scrollbarWidth: 'thin' }}>
          {group(
            'Clipboard',
            <button onMouseDown={keep} onClick={pickPainter} className={btn(!!painter)} title="Format Painter">
              🖌 Format Painter
            </button>
          )}
          {group(
            'Font',
            <>
              <select aria-label="Font" className={selCls} style={{ width: 96 }} value={cur.font ?? 'Calibri'} onChange={e => applyChar(f => ({ ...f, font: e.target.value === 'Calibri' ? undefined : e.target.value }), 'Font')}>
                {FONTS.map(f => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <select aria-label="Font size" className={selCls} style={{ width: 44 }} value={cur.size ?? 11} onChange={e => applyChar(f => ({ ...f, size: Number(e.target.value) === 11 ? undefined : Number(e.target.value) }), 'Font size')}>
                {SIZES.map(n => (
                  <option key={n}>{n}</option>
                ))}
              </select>
              <select
                aria-label="Change Case"
                title="Change Case"
                className={selCls}
                style={{ width: 44 }}
                value=""
                onChange={e => {
                  changeCase(e.target.value)
                  e.target.value = ''
                }}
              >
                <option value="">Aa</option>
                <option value="sentence">Sentence case.</option>
                <option value="lower">lowercase</option>
                <option value="upper">UPPERCASE</option>
                <option value="title">Capitalize Each Word</option>
                <option value="toggle">tOGGLE cASE</option>
              </select>
              <button onMouseDown={keep} onClick={clearFormatting} className={btn()} title="Clear All Formatting">
                A⌫
              </button>
              <button onMouseDown={keep} onClick={() => toggle('b', 'Bold')} className={`${btn(cur.b)} font-bold`} title="Bold (Ctrl+B)">
                B
              </button>
              <button onMouseDown={keep} onClick={() => toggle('i', 'Italic')} className={`${btn(cur.i)} italic font-serif`} title="Italic (Ctrl+I)">
                I
              </button>
              <button onMouseDown={keep} onClick={() => toggle('u', 'Underline')} className={`${btn(cur.u)} underline`} title="Underline (Ctrl+U)">
                U
              </button>
              <button onMouseDown={keep} onClick={() => toggle('s', 'Strikethrough')} className={`${btn(cur.s)} line-through`} title="Strikethrough">
                abc
              </button>
              <button onMouseDown={keep} onClick={() => script('sub')} className={btn(cur.sub)} title="Subscript (Ctrl+=)">
                x₂
              </button>
              <button onMouseDown={keep} onClick={() => script('sup')} className={btn(cur.sup)} title="Superscript (Ctrl+Shift++)">
                x²
              </button>
              <select aria-label="Text Highlight Colour" title="Text Highlight Colour" className={selCls} style={{ width: 40 }} value="" onChange={e => applyChar(f => ({ ...f, hl: e.target.value || undefined }), 'Highlight')}>
                <option value="">ab▾</option>
                {HIGHLIGHTS.map(([v, l]) => (
                  <option key={l} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <select aria-label="Font Colour" title="Font Colour" className={selCls} style={{ width: 40 }} value="" onChange={e => applyChar(f => ({ ...f, color: e.target.value || undefined }), 'Font colour')}>
                <option value="">A▾</option>
                {COLORS.map(([v, l]) => (
                  <option key={l} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </>
          )}
          {group(
            'Paragraph',
            <>
              <button onMouseDown={keep} onClick={() => toggleList('bullet')} className={btn(P.list === 'bullet')} title="Bullets">
                •≡
              </button>
              <button onMouseDown={keep} onClick={() => toggleList('number')} className={btn(P.list === 'number')} title="Numbering">
                1≡
              </button>
              <button onMouseDown={keep} onClick={() => applyPara(p => ({ ...p, left: Math.max(0, p.left - 1.27) }))} className={btn()} title="Decrease Indent">
                ⇤
              </button>
              <button onMouseDown={keep} onClick={() => applyPara(p => ({ ...p, left: p.left + 1.27 }))} className={btn()} title="Increase Indent">
                ⇥
              </button>
              <select
                aria-label="Sort"
                title="Sort"
                className={selCls}
                style={{ width: 44 }}
                value=""
                onChange={e => {
                  sort(e.target.value === 'desc')
                  e.target.value = ''
                }}
              >
                <option value="">A↓Z</option>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button onMouseDown={keep} onClick={() => setMarks(m => !m)} className={btn(marks)} title="Show/Hide ¶ (Ctrl+Shift+8)">
                ¶
              </button>
              {(['left', 'center', 'right', 'justify'] as const).map(a => (
                <button key={a} onMouseDown={keep} onClick={() => applyPara(p => ({ ...p, align: a }))} className={btn(P.align === a)} title={{ left: 'Align Left (Ctrl+L)', center: 'Center (Ctrl+E)', right: 'Align Right (Ctrl+R)', justify: 'Justify (Ctrl+J)' }[a]}>
                  {{ left: '⫷', center: '≡', right: '⫸', justify: '☰' }[a]}
                </button>
              ))}
              <select aria-label="Line and Paragraph Spacing" title="Line and Paragraph Spacing" className={selCls} style={{ width: 52 }} value={P.line} onChange={e => applyPara(p => ({ ...p, line: Number(e.target.value) }))}>
                {[1, 1.08, 1.15, 1.5, 2, 2.5, 3].map(n => (
                  <option key={n} value={n}>
                    {n.toFixed(n === 1.08 || n === 1.15 ? 2 : 1)}
                  </option>
                ))}
              </select>
              <button onMouseDown={keep} onClick={() => setShowPara(v => !v)} className={btn(showPara)} title="Paragraph dialog box launcher">
                ↘
              </button>
            </>
          )}
        </div>

        {showPara && (
          <div className="px-3 py-2 bg-white border-b border-[#d4d4d4] text-[12px] grid grid-cols-2 sm:grid-cols-4 gap-2">
            <p className="col-span-full font-semibold text-[#2B579A]">Paragraph — Indents and Spacing</p>
            {(
              [
                ['left', 'Left (cm)', 0.25],
                ['right', 'Right (cm)', 0.25],
                ['by', 'By (cm)', 0.25],
                ['before', 'Before (pt)', 6],
                ['after', 'After (pt)', 6],
              ] as [keyof ParaFmt, string, number][]
            ).map(([k, l, step]) => (
              <label key={k} className="flex flex-col">
                {l}
                <input type="number" step={step} min={k === 'left' || k === 'right' ? -2 : 0} value={Number(P[k])} onMouseDown={e => e.stopPropagation()} onChange={e => applyPara(p => ({ ...p, [k]: Number(e.target.value) || 0 }))} className="border border-[#c6c6c6] rounded px-1 py-0.5" />
              </label>
            ))}
            <label className="flex flex-col">
              Special
              <select value={P.special} onChange={e => applyPara(p => ({ ...p, special: e.target.value as ParaFmt['special'], by: e.target.value === 'none' ? 0 : p.by || 1.27 }))} className="border border-[#c6c6c6] rounded px-1 py-0.5">
                <option value="none">(none)</option>
                <option value="first">First line</option>
                <option value="hanging">Hanging</option>
              </select>
            </label>
          </div>
        )}

        {/* ruler */}
        <div className="px-3 pt-2 bg-[#f3f3f3]">
          <div className="mx-auto max-w-[560px] bg-[#cfcfcf]" style={{ padding: `0 ${PAGE_PAD}px` }}>
            <div ref={rulerRef} className="relative h-6 bg-white select-none" style={{ touchAction: 'none' }}>
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                  <span key={n} className="absolute top-[7px] text-[8px] text-[#666] -translate-x-1/2" style={{ left: px(n) }}>
                    {n}
                  </span>
                ))}
              </div>
              <button aria-label="First Line Indent marker" title={`First Line Indent: ${firstCm.toFixed(2)} cm`} onPointerDown={dragMarker('first')} onMouseDown={e => e.preventDefault()} className="absolute top-0 -translate-x-1/2 w-3 h-2.5 cursor-ew-resize" style={{ left: px(firstCm), clipPath: 'polygon(0 0,100% 0,50% 100%)', background: '#555' }} />
              <button aria-label="Hanging Indent marker" title={`Hanging Indent: ${otherCm.toFixed(2)} cm`} onPointerDown={dragMarker('hanging')} onMouseDown={e => e.preventDefault()} className="absolute top-[13px] -translate-x-1/2 w-3 h-2 cursor-ew-resize" style={{ left: px(otherCm), clipPath: 'polygon(50% 0,100% 100%,0 100%)', background: '#555' }} />
              <button aria-label="Left Indent marker" title={`Left Indent: ${P.left.toFixed(2)} cm`} onPointerDown={dragMarker('left')} onMouseDown={e => e.preventDefault()} className="absolute top-[21px] -translate-x-1/2 w-3 h-1.5 cursor-ew-resize" style={{ left: px(otherCm), background: '#555' }} />
              <button aria-label="Right Indent marker" title={`Right Indent: ${P.right.toFixed(2)} cm`} onPointerDown={dragMarker('right')} onMouseDown={e => e.preventDefault()} className="absolute top-[13px] translate-x-1/2 w-3 h-2 cursor-ew-resize" style={{ right: px(P.right), clipPath: 'polygon(50% 0,100% 100%,0 100%)', background: '#555' }} />
            </div>
          </div>
        </div>

        {/* page */}
        <div className="px-3 pb-3 pt-1 bg-[#f3f3f3]">
          <div
            ref={docRef}
            onMouseUp={onDocMouseUp}
            onTouchEnd={onDocMouseUp}
            className="mx-auto max-w-[560px] bg-white shadow border border-[#d4d4d4] select-text"
            style={{ padding: `22px ${PAGE_PAD}px 28px`, cursor: painter ? 'copy' : 'text', color: '#111' }}
          >
            {doc.map((p, pi) => {
              const isNum = p.p.list === 'number'
              if (isNum) number++
              else number = 0
              const base = p.runs[0]?.f.size ?? 11
              return (
                <div
                  key={pi}
                  data-pi={pi}
                  style={{
                    textAlign: p.p.align,
                    lineHeight: 1.22 * p.p.line,
                    marginTop: `${p.p.before * 1.33 * 0.85}px`,
                    marginBottom: `${p.p.after * 1.33 * 0.85}px`,
                    marginLeft: px(p.p.left),
                    marginRight: px(p.p.right),
                    textIndent: p.p.special === 'first' ? px(p.p.by) : p.p.special === 'hanging' ? px(-p.p.by) : 0,
                    fontSize: `${base * PX_PT}px`,
                    fontFamily: FONT_CSS.Calibri,
                    position: 'relative',
                  }}
                >
                  {p.p.list && (
                    <span contentEditable={false} data-skip className="select-none" style={{ display: 'inline-block', width: px(p.p.by || 0.63), textIndent: 0 }}>
                      {isNum ? `${number}.` : '•'}
                    </span>
                  )}
                  {(() => {
                    let off = 0
                    return p.runs.map((r, ri) => {
                      const ro = off
                      off += r.text.length
                      const f = r.f
                      return (
                        <span
                          key={ri}
                          data-ro={ro}
                          style={{
                            fontWeight: f.b ? 700 : undefined,
                            fontStyle: f.i ? 'italic' : undefined,
                            textDecoration: [f.u ? 'underline' : '', f.s ? 'line-through' : ''].filter(Boolean).join(' ') || undefined,
                            verticalAlign: f.sub ? 'sub' : f.sup ? 'super' : undefined,
                            fontSize: f.sub || f.sup ? `${(f.size ?? 11) * PX_PT * 0.65}px` : f.size ? `${f.size * PX_PT}px` : undefined,
                            fontFamily: f.font ? FONT_CSS[f.font] : undefined,
                            color: f.color,
                            background: f.hl,
                          }}
                        >
                          {marks
                            ? r.text.split(/( )/).map((part, k) =>
                                part === ' ' ? (
                                  <span key={k} style={{ backgroundImage: 'radial-gradient(circle, #2B579A 1.3px, transparent 1.6px)', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
                                    {' '}
                                  </span>
                                ) : (
                                  part
                                )
                              )
                            : r.text}
                        </span>
                      )
                    })
                  })()}
                  {marks && (
                    <span contentEditable={false} data-skip className="select-none text-[#2B579A]">
                      ¶
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="px-2 py-1 text-[10.5px] text-white flex justify-between gap-2" style={{ background: '#2B579A' }}>
          <span>
            PAGE 1 OF 1 · {doc.reduce((s, p) => s + textOf(p).split(/\s+/).filter(Boolean).length, 0)} WORDS
          </span>
          <span className="truncate">
            {P.special === 'first' ? `First line ${P.by.toFixed(2)} cm` : P.special === 'hanging' ? `Hanging ${P.by.toFixed(2)} cm` : 'No special indent'} · Left {P.left.toFixed(2)} cm · Line {P.line}
          </span>
        </div>
      </div>

      {note && <p className="mx-3 -mt-1 mb-2 px-3 py-2 rounded-lg text-[12px] bg-brand-sky/10 border border-brand-sky/30">{note}</p>}

      <div className="px-4 pb-4">
        <p className="text-[12px] font-bold mb-1">
          Tasks: {done} / {tasks.length} done {done === tasks.length && '🎉'}
        </p>
        <ul className="space-y-0.5 text-[12px]">
          {tasks.map(([ok, t]) => (
            <li key={t} className={ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-brand-navy/80 dark:text-white/80'}>
              {ok ? '✓' : '○'} {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
