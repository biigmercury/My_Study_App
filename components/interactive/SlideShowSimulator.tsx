'use client'

import { useEffect, useRef, useState } from 'react'

// A miniature PowerPoint for the CSC 272 PowerPoint lessons: the "My Journey in UI so far" deck from
// the lecture notes, with Slide Sorter (reorder, duplicate, delete, hide), themes, transitions with
// effect options/duration/advance timing, bullet animations (by paragraph or as one object), a slide
// show that obeys PowerPoint's keys (N/P, arrows, number+Enter, B/W, H, Esc) and Rehearse Timings.

type Layout = 'title' | 'content' | 'two' | 'org' | 'end'
interface SlideDef {
  id: number
  layout: Layout
  title: string
  sub?: string
  bullets?: string[]
  pic?: string
  hidden?: boolean
  transition: Transition
  anim: Anim
  after?: number
}
type TransName = 'None' | 'Fade' | 'Push' | 'Wipe' | 'Split' | 'Cover' | 'Uncover'
type Dir = 'right' | 'left' | 'top' | 'bottom'
interface Transition {
  name: TransName
  dir: Dir
  dur: number
}
type AnimName = 'None' | 'Appear' | 'Fade' | 'Fly In' | 'Wipe' | 'Zoom'
interface Anim {
  name: AnimName
  seq: 'paragraph' | 'one'
  start: 'click' | 'after'
}

const NO_T: Transition = { name: 'None', dir: 'right', dur: 1 }
const NO_A: Anim = { name: 'None', seq: 'paragraph', start: 'click' }

const DECK: Omit<SlideDef, 'transition' | 'anim'>[] = [
  { id: 1, layout: 'title', title: 'My Journey in UI so far', sub: 'Adaeze Okafor · 234567' },
  { id: 2, layout: 'content', title: 'Introduction', bullets: ['My name', 'Level of study', 'Course of study', 'Year of entry', 'State of origin'] },
  { id: 3, layout: 'two', title: 'Academic Background', bullets: ['Secondary school: Ibadan', 'WAEC: 2023', 'UTME: 2024', 'Favourite subject: Maths'], pic: '🏫' },
  { id: 4, layout: 'content', title: 'Academic Achievements', bullets: ['Best in Mathematics, 100L', 'Dean’s list, first semester', 'Tutor, CSC 101 study group'] },
  { id: 5, layout: 'content', title: 'Personal Achievement', bullets: ['Completed a Python course', 'Volunteer at a health outreach', 'Hall football team'] },
  { id: 6, layout: 'org', title: 'University of Ibadan Organogram', bullets: ['Vice-Chancellor', 'Deputy VC (Academic)', 'Deputy VC (Admin)', 'Deputy VC (Research)', 'Registrar'] },
  { id: 7, layout: 'content', title: 'My Department', bullets: ['Computer Science', 'Faculty of Science', 'Four-year B.Sc. programme'] },
  { id: 8, layout: 'end', title: 'Conclusion', sub: 'Thank you! Questions?' },
]

const THEMES = [
  { name: 'Office Theme (default)', bg: '#ffffff', fg: '#262626', title: '#262626', accent: '#5B9BD5', band: '' },
  { name: 'Blue band', bg: '#ffffff', fg: '#1f2937', title: '#1f3a5f', accent: '#2E75B6', band: '#2E75B6' },
  { name: 'Dark slate', bg: '#1f2a36', fg: '#e5e7eb', title: '#ffffff', accent: '#4fc3f7', band: '#4fc3f7' },
  { name: 'Warm sand', bg: '#fbf5ea', fg: '#3f3a33', title: '#8a4b1c', accent: '#d9822b', band: '#d9822b' },
]

const KEYFRAMES = `
@keyframes ss-fade-in{from{opacity:0}to{opacity:1}}
@keyframes ss-in-right{from{transform:translateX(100%)}to{transform:none}}
@keyframes ss-in-left{from{transform:translateX(-100%)}to{transform:none}}
@keyframes ss-in-bottom{from{transform:translateY(100%)}to{transform:none}}
@keyframes ss-in-top{from{transform:translateY(-100%)}to{transform:none}}
@keyframes ss-out-right{from{transform:none}to{transform:translateX(-100%)}}
@keyframes ss-out-left{from{transform:none}to{transform:translateX(100%)}}
@keyframes ss-out-bottom{from{transform:none}to{transform:translateY(-100%)}}
@keyframes ss-out-top{from{transform:none}to{transform:translateY(100%)}}
@keyframes ss-wipe-right{from{clip-path:inset(0 0 0 100%)}to{clip-path:inset(0)}}
@keyframes ss-wipe-left{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0)}}
@keyframes ss-wipe-bottom{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0)}}
@keyframes ss-wipe-top{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0)}}
@keyframes ss-split{from{clip-path:inset(0 50% 0 50%)}to{clip-path:inset(0)}}
@keyframes ss-a-fade{from{opacity:0}to{opacity:1}}
@keyframes ss-a-fly{from{opacity:0;transform:translateY(160%)}to{opacity:1;transform:none}}
@keyframes ss-a-wipe{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0)}}
@keyframes ss-a-zoom{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:none}}
`

const buildSteps = (s: SlideDef) => (s.anim.name === 'None' || !s.bullets?.length || s.anim.start === 'after' ? 0 : s.anim.seq === 'one' ? 1 : s.bullets.length)

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

type Tab = 'sorter' | 'design' | 'transitions' | 'animations' | 'show'

export default function SlideShowSimulator({ start = 'sorter' }: { start?: string }) {
  const [slides, setSlides] = useState<SlideDef[]>(() => DECK.map(s => ({ ...s, transition: NO_T, anim: NO_A })))
  const [history, setHistory] = useState<SlideDef[][]>([])
  const [cur, setCur] = useState(0)
  const [tab, setTab] = useState<Tab>((start as Tab) || 'sorter')
  const [theme, setTheme] = useState(0)
  const [useTimings, setUseTimings] = useState(true)
  const [nextId, setNextId] = useState(9)
  const [msg, setMsg] = useState<string | null>(null)

  // slide show state
  const [show, setShow] = useState<null | { idx: number; step: number; prev: number | null; tick: number; blank: null | 'black' | 'white'; ended: boolean; typed: string; rehearse: boolean }>(null)
  const [rehearseTimes, setRehearseTimes] = useState<number[]>([])
  const [clock, setClock] = useState({ slide: 0, total: 0 })
  const [keepTimings, setKeepTimings] = useState<number[] | null>(null)
  const [rehearsalTotal, setRehearsalTotal] = useState(0)
  const [overview, setOverview] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const enterTime = useRef(0)
  const startTime = useRef(0)

  const T = THEMES[theme]
  const edit = (fn: (s: SlideDef[]) => SlideDef[]) => {
    setHistory(h => [...h.slice(-30), slides])
    setSlides(fn)
  }
  const undo = () => {
    if (!history.length) return
    setSlides(history[history.length - 1])
    setHistory(h => h.slice(0, -1))
  }
  const sel = slides[Math.min(cur, slides.length - 1)]
  const patchSel = (p: Partial<SlideDef>) => edit(ss => ss.map((s, i) => (i === cur ? { ...s, ...p } : s)))

  // ---------- slide rendering ----------

  const renderSlide = (s: SlideDef, opts: { step?: number; animate?: boolean; scale?: 'thumb' | 'stage'; key?: string; order?: boolean } = {}) => {
    const visible = (i: number) => {
      if (s.anim.name === 'None' || s.anim.start === 'after') return true
      if (opts.step === undefined) return true
      return s.anim.seq === 'one' ? opts.step >= 1 : i < opts.step
    }
    const animOf = (i: number): React.CSSProperties | undefined => {
      if (!opts.animate || s.anim.name === 'None' || s.anim.name === 'Appear') return undefined
      const name = { Fade: 'ss-a-fade', 'Fly In': 'ss-a-fly', Wipe: 'ss-a-wipe', Zoom: 'ss-a-zoom' }[s.anim.name]
      const delay = s.anim.start === 'after' ? (s.anim.seq === 'one' ? 0.3 : 0.3 + i * 0.6) : 0
      return { animation: `${name} .5s ease-out ${delay}s both` }
    }
    const justShown = (i: number) => opts.step !== undefined && (s.anim.seq === 'one' ? opts.step === 1 : i === opts.step - 1)
    const u = (n: number) => `calc(${n} * 100cqw / 960)`
    const badge = (i: number) =>
      opts.order && s.anim.name !== 'None' && s.anim.start === 'click' && (s.anim.seq === 'paragraph' || i === 0) ? (
        <span style={{ position: 'absolute', left: u(-58), fontSize: u(18), lineHeight: 1, padding: `${u(3)} ${u(7)}`, background: '#d9d9d9', border: '1px solid #888', color: '#333' }}>{i + 1}</span>
      ) : null
    return (
      <div key={opts.key} className="absolute inset-0 overflow-hidden" style={{ background: T.bg, color: T.fg, fontFamily: 'Calibri, Carlito, "Segoe UI", Arial, sans-serif', containerType: 'inline-size' }}>
        {T.band && <div className="absolute left-0 top-0 h-full" style={{ width: u(18), background: T.band }} />}
        {s.layout === 'title' || s.layout === 'end' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ padding: `0 ${u(80)}` }}>
            <p style={{ fontSize: u(s.layout === 'title' ? 54 : 48), color: T.title, lineHeight: 1.1, fontWeight: 300 }}>{s.title}</p>
            {s.sub && <p style={{ fontSize: u(24), marginTop: u(20), color: T.fg, opacity: 0.85 }}>{s.sub}</p>}
          </div>
        ) : (
          <div className="absolute" style={{ inset: `${u(40)} ${u(60)} ${u(30)} ${u(70)}` }}>
            <p style={{ fontSize: u(40), color: T.title, lineHeight: 1.1, fontWeight: 300, marginBottom: u(24) }}>{s.title}</p>
            {s.layout === 'org' ? (
              <div className="flex flex-col items-center" style={{ gap: u(26), fontSize: u(20) }}>
                <div style={{ position: 'relative', background: T.accent, color: '#fff', padding: `${u(10)} ${u(26)}`, borderRadius: u(6), opacity: visible(0) ? 1 : 0, ...(visible(0) && (s.anim.start === 'after' || justShown(0)) ? animOf(0) : {}) }}>
                  {opts.order && s.anim.name !== 'None' && s.anim.start === 'click' && <span style={{ position: 'absolute', left: u(-40), top: 0, fontSize: u(16), padding: `${u(2)} ${u(6)}`, background: '#d9d9d9', border: '1px solid #888', color: '#333' }}>1</span>}
                  {s.bullets![0]}
                </div>
                <div className="flex flex-wrap justify-center" style={{ gap: u(14) }}>
                  {s.bullets!.slice(1).map((b, j) => (
                    <div key={b} style={{ border: `${u(2)} solid ${T.accent}`, padding: `${u(8)} ${u(12)}`, borderRadius: u(6), opacity: visible(j + 1) ? 1 : 0, ...(visible(j + 1) && (s.anim.start === 'after' || justShown(j + 1)) ? animOf(j + 1) : {}) }}>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex" style={{ gap: u(30) }}>
                <ul style={{ fontSize: u(28), lineHeight: 1.35, listStyle: 'none', flex: 1 }}>
                  {(s.bullets ?? []).map((b, i) => (
                    <li key={i} style={{ display: 'flex', position: 'relative', alignItems: 'center', gap: u(12), opacity: visible(i) ? 1 : 0, ...(visible(i) && (s.anim.start === 'after' || justShown(i)) ? animOf(i) : {}) }}>
                      {badge(i)}
                      <span style={{ color: T.accent }}>•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {s.layout === 'two' && (
                  <div className="flex items-center justify-center" style={{ flex: 0.8, fontSize: u(120), background: 'rgba(127,127,127,0.12)', borderRadius: u(8), minHeight: u(240) }}>
                    {s.pic}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {opts.scale === 'thumb' && s.anim.name !== 'None' && s.anim.start === 'click' && s.bullets && (
          <div className="absolute right-1 top-1 text-[8px] px-1 rounded bg-amber-200 text-amber-900">anim</div>
        )}
      </div>
    )
  }

  // ---------- slide show engine ----------

  const order = slides
  const nextVisible = (from: number) => {
    for (let i = from + 1; i < order.length; i++) if (!order[i].hidden) return i
    return -1
  }
  const prevVisible = (from: number) => {
    for (let i = from - 1; i >= 0; i--) if (!order[i].hidden) return i
    return -1
  }

  const recordLeave = (idx: number) => {
    if (!show?.rehearse) return
    const spent = Math.round((Date.now() - enterTime.current) / 1000)
    setRehearseTimes(t => {
      const n = [...t]
      n[idx] = spent
      return n
    })
  }

  const goTo = (idx: number, step = 0) => {
    if (!show || idx < 0) return
    recordLeave(show.idx)
    enterTime.current = Date.now()
    setShow({ ...show, prev: show.ended ? null : show.idx, idx, step, tick: show.tick + 1, blank: null, ended: false, typed: '' })
  }

  const endShow = () => {
    if (show?.rehearse) {
      const times = [...rehearseTimes]
      if (!show.ended) times[show.idx] = Math.round((Date.now() - enterTime.current) / 1000)
      setKeepTimings(times)
      setRehearsalTotal(Math.round((Date.now() - startTime.current) / 1000))
    }
    setShow(null)
    setOverview(false)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }

  const next = () => {
    if (!show) return
    if (show.blank) return setShow({ ...show, blank: null })
    if (show.ended) return endShow()
    const s = order[show.idx]
    if (show.step < buildSteps(s)) return setShow({ ...show, step: show.step + 1 })
    const n = nextVisible(show.idx)
    if (n < 0) {
      recordLeave(show.idx)
      return setShow({ ...show, ended: true, prev: null })
    }
    goTo(n)
  }

  const prev = () => {
    if (!show) return
    if (show.ended) {
      const p = prevVisible(order.length)
      return setShow({ ...show, ended: false, idx: p, step: buildSteps(order[p]), prev: null, tick: show.tick + 1 })
    }
    if (show.step > 0) return setShow({ ...show, step: show.step - 1 })
    const p = prevVisible(show.idx)
    if (p >= 0) goTo(p, buildSteps(order[p]))
  }

  const begin = (from: number, rehearse = false) => {
    let idx = from
    if (order[idx]?.hidden) idx = nextVisible(idx)
    if (idx < 0) return setMsg('Every slide from here on is hidden — nothing to show.')
    enterTime.current = Date.now()
    startTime.current = Date.now()
    setRehearseTimes([])
    setKeepTimings(null)
    setShow({ idx, step: 0, prev: null, tick: 0, blank: null, ended: false, typed: '', rehearse })
    setTab('show')
    requestAnimationFrame(() => stageRef.current?.focus())
  }

  // automatic advance (Advance Slide: After n seconds) and "After Previous" animations
  useEffect(() => {
    if (!show || show.ended || show.blank || show.rehearse || !useTimings) return
    const s = order[show.idx]
    if (s.after === undefined) return
    const t = setTimeout(() => {
      const n = nextVisible(show.idx)
      if (n < 0) {
        recordLeave(show.idx)
        setShow({ ...show, ended: true, prev: null })
      } else goTo(n)
    }, s.after * 1000 + s.transition.dur * 1000)
    return () => clearTimeout(t)
  }, [show?.idx, show?.ended, show?.blank, show?.tick, useTimings]) // eslint-disable-line react-hooks/exhaustive-deps

  // rehearsal clock
  useEffect(() => {
    if (!show?.rehearse) return
    const t = setInterval(() => setClock({ slide: (Date.now() - enterTime.current) / 1000, total: (Date.now() - startTime.current) / 1000 }), 250)
    return () => clearInterval(t)
  }, [show?.rehearse])

  const onKey = (e: React.KeyboardEvent) => {
    if (!show) return
    const k = e.key
    if (/^[0-9]$/.test(k)) {
      e.preventDefault()
      return setShow({ ...show, typed: (show.typed + k).slice(-3) })
    }
    if (k === 'Enter' && show.typed) {
      e.preventDefault()
      const n = parseInt(show.typed, 10) - 1
      if (n >= 0 && n < order.length) goTo(n)
      else setShow({ ...show, typed: '' })
      return
    }
    const nextKeys = ['n', 'N', 'ArrowRight', 'ArrowDown', ' ', 'Enter', 'PageDown']
    const prevKeys = ['p', 'P', 'ArrowLeft', 'ArrowUp', 'Backspace', 'PageUp']
    if (nextKeys.includes(k)) {
      e.preventDefault()
      next()
    } else if (prevKeys.includes(k)) {
      e.preventDefault()
      prev()
    } else if (k === 'b' || k === 'B' || k === '.') {
      e.preventDefault()
      setShow({ ...show, blank: show.blank === 'black' ? null : 'black' })
    } else if (k === 'w' || k === 'W' || k === ',') {
      e.preventDefault()
      setShow({ ...show, blank: show.blank === 'white' ? null : 'white' })
    } else if (k === 'h' || k === 'H') {
      e.preventDefault()
      const n = show.idx + 1
      if (n < order.length && order[n].hidden) goTo(n)
    } else if (k === 'Escape' || k === '-') {
      e.preventDefault()
      endShow()
    } else if (k === 'Home') {
      e.preventDefault()
      goTo(nextVisible(-1))
    } else if (k === 'End') {
      e.preventDefault()
      const last = prevVisible(order.length)
      goTo(last, buildSteps(order[last]))
    }
  }

  // ---------- transitions ----------

  const transitionStyles = (s: SlideDef): { incoming?: React.CSSProperties; outgoing?: React.CSSProperties } => {
    const t = s.transition
    const d = `${t.dur}s`
    switch (t.name) {
      case 'Fade':
        return { incoming: { animation: `ss-fade-in ${d} ease both` } }
      case 'Push':
        return { incoming: { animation: `ss-in-${t.dir} ${d} ease both` }, outgoing: { animation: `ss-out-${t.dir} ${d} ease both` } }
      case 'Wipe':
        return { incoming: { animation: `ss-wipe-${t.dir} ${d} linear both` } }
      case 'Split':
        return { incoming: { animation: `ss-split ${d} ease both` } }
      case 'Cover':
        return { incoming: { animation: `ss-in-${t.dir} ${d} ease both` } }
      case 'Uncover':
        return { incoming: {}, outgoing: { animation: `ss-out-${t.dir} ${d} ease both`, zIndex: 3 } }
      default:
        return {}
    }
  }

  // ---------- sorter operations ----------

  const move = (delta: number) => {
    const j = cur + delta
    if (j < 0 || j >= slides.length) return
    edit(ss => {
      const n = [...ss]
      ;[n[cur], n[j]] = [n[j], n[cur]]
      return n
    })
    setCur(j)
  }
  const duplicate = () => {
    edit(ss => {
      const n = [...ss]
      n.splice(cur + 1, 0, { ...ss[cur], id: nextId })
      return n
    })
    setNextId(i => i + 1)
    setCur(cur + 1)
  }
  const remove = () => {
    if (slides.length === 1) return
    edit(ss => ss.filter((_, i) => i !== cur))
    setCur(Math.max(0, cur - 1))
    setMsg('Slide deleted — Ctrl+Z (Undo) brings it back.')
  }
  const toggleHide = () => patchSel({ hidden: !sel.hidden })
  const applyToAll = (what: 'transition' | 'anim') => {
    edit(ss => ss.map(s => ({ ...s, [what]: sel[what], ...(what === 'transition' ? { after: sel.after } : {}) })))
    setMsg(what === 'transition' ? 'Applied this transition and timing to every slide — the star appears under each thumbnail.' : 'Applied this animation to every slide.')
  }

  // ---------- UI ----------

  const btn = 'px-2 py-1 rounded border text-[11.5px] border-[#c6c6c6] bg-white text-[#333] hover:border-[#B7472A] disabled:opacity-40'
  const sel_ = 'border border-[#c6c6c6] rounded px-1 py-0.5 bg-white text-[12px] text-[#222]'

  const thumbs = (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2 bg-[#e9e9e9]">
      {slides.map((s, i) => (
        <button key={s.id} onClick={() => setCur(i)} className="text-left" aria-label={`Slide ${i + 1}: ${s.title}`}>
          <div className={`relative w-full rounded-sm overflow-hidden ${i === cur ? 'ring-2 ring-[#B7472A]' : 'ring-1 ring-[#bdbdbd]'}`} style={{ aspectRatio: '16/9', opacity: s.hidden ? 0.45 : 1 }}>
            {renderSlide(s, { scale: 'thumb' })}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[10.5px] text-[#444]">
            <span style={{ textDecoration: s.hidden ? 'line-through' : undefined }} className={s.hidden ? 'px-0.5 border border-[#777]' : ''}>
              {i + 1}
            </span>
            {s.transition.name !== 'None' && <span title="This slide has a transition">★</span>}
            {s.after !== undefined && <span className="ml-auto">{fmt(s.after)}</span>}
          </div>
        </button>
      ))}
    </div>
  )

  const stage = show && (
    <div
      ref={stageRef}
      tabIndex={0}
      onKeyDown={onKey}
      onClick={e => {
        if ((e.target as HTMLElement).closest('[data-ctl]')) return
        next()
      }}
      className="relative w-full outline-none bg-black select-none cursor-pointer"
      style={{ aspectRatio: '16/9' }}
    >
      {show.ended ? (
        <div className="absolute inset-0 bg-black text-white/90 flex items-start justify-center pt-4 text-[12px]">End of slide show, click to exit.</div>
      ) : (
        <>
          {show.prev !== null && order[show.prev] && (
            <div key={`out-${show.tick}`} className="absolute inset-0" style={{ zIndex: 1, ...transitionStyles(order[show.idx]).outgoing }}>
              {renderSlide(order[show.prev], { step: buildSteps(order[show.prev]) })}
            </div>
          )}
          <div key={`in-${show.tick}`} className="absolute inset-0" style={{ zIndex: 2, ...transitionStyles(order[show.idx]).incoming }}>
            {renderSlide(order[show.idx], { step: show.step, animate: true, key: `s-${show.idx}` })}
          </div>
        </>
      )}
      {show.blank && <div className="absolute inset-0 z-10" style={{ background: show.blank === 'black' ? '#000' : '#fff' }} />}
      {show.typed && <div className="absolute left-2 top-2 z-20 px-1.5 rounded bg-black/70 text-white text-[12px]">Go to slide {show.typed}… (Enter)</div>}
      {show.rehearse && (
        <div data-ctl className="absolute left-2 top-2 z-20 flex items-center gap-2 px-2 py-1 rounded bg-white/95 text-[#222] text-[11.5px] shadow" onClick={e => e.stopPropagation()}>
          <b>Recording</b>
          <button onClick={next} className="px-1.5 border rounded">→ Next</button>
          <span className="font-mono">{fmt(clock.slide)}</span>
          <button onClick={() => (enterTime.current = Date.now())} className="px-1.5 border rounded" title="Repeat: restart this slide’s clock">
            ↺
          </button>
          <span className="font-mono text-[#666]">{fmt(clock.total)}</span>
        </div>
      )}
      {overview && (
        <div data-ctl className="absolute inset-0 z-30 bg-[#262626]/95 p-2 overflow-auto" onClick={e => e.stopPropagation()}>
          <p className="text-white text-[11px] mb-1">See All Slides — click one to jump</p>
          <div className="grid grid-cols-4 gap-1.5">
            {order.map((s, i) => (
              <button
                key={s.id}
                onClick={() => {
                  setOverview(false)
                  goTo(i)
                  stageRef.current?.focus()
                }}
                className="relative rounded-sm overflow-hidden ring-1 ring-white/40"
                style={{ aspectRatio: '16/9', opacity: s.hidden ? 0.5 : 1 }}
              >
                {renderSlide(s, { scale: 'thumb' })}
              </button>
            ))}
          </div>
        </div>
      )}
      <div data-ctl className="absolute left-2 bottom-2 z-20 flex gap-1 opacity-70 hover:opacity-100" onClick={e => e.stopPropagation()}>
        {[
          ['◀', 'Previous (P, ←)', prev],
          ['▶', 'Next (N, →, Space, click)', next],
          ['▦', 'See All Slides', () => setOverview(v => !v)],
          ['■', 'Black screen (B)', () => setShow(s => (s ? { ...s, blank: s.blank === 'black' ? null : 'black' } : s))],
          ['⛶', 'Full screen', () => stageRef.current?.requestFullscreen?.().catch(() => {})],
          ['✕', 'End Show (Esc)', endShow],
        ].map(([icon, label, fn]) => (
          <button key={label as string} title={label as string} aria-label={label as string} onClick={() => (fn as () => void)()} className="w-6 h-6 rounded-full bg-black/60 text-white text-[11px]">
            {icon as string}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <style>{KEYFRAMES}</style>
      <div className="flex items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🎞️ Mini PowerPoint — “My Journey in UI so far”</p>
        <button onClick={undo} disabled={!history.length} className="text-[11px] font-semibold text-brand-deep dark:text-brand-sky disabled:opacity-40">
          ↶ Undo
        </button>
      </div>

      <div className="m-3 rounded-md border border-[#b8b8b8] overflow-hidden bg-white text-[#222]" style={{ fontFamily: '"Segoe UI", Calibri, Arial, sans-serif' }}>
        <div className="flex overflow-x-auto text-[11.5px] border-b border-[#d4d4d4]" style={{ background: '#B7472A' }}>
          {(
            [
              ['sorter', 'SLIDE SORTER'],
              ['design', 'DESIGN'],
              ['transitions', 'TRANSITIONS'],
              ['animations', 'ANIMATIONS'],
              ['show', 'SLIDE SHOW'],
            ] as [Tab, string][]
          ).map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 shrink-0 font-semibold ${tab === t ? 'bg-[#f3f3f3] text-[#B7472A]' : 'text-white/90 hover:bg-white/10'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* command strip */}
        <div className="px-2 py-2 bg-[#f3f3f3] border-b border-[#d4d4d4] text-[12px] space-y-1.5">
          {tab === 'sorter' && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[11px] text-[#555] mr-1">Slide {cur + 1}:</span>
              <button className={btn} onClick={() => move(-1)} disabled={cur === 0}>
                ← Move earlier
              </button>
              <button className={btn} onClick={() => move(1)} disabled={cur === slides.length - 1}>
                Move later →
              </button>
              <button className={btn} onClick={duplicate}>
                Duplicate Slide
              </button>
              <button className={btn} onClick={toggleHide}>
                {sel.hidden ? 'Unhide Slide' : 'Hide Slide'}
              </button>
              <button className={btn} onClick={remove} disabled={slides.length === 1}>
                Delete
              </button>
            </div>
          )}
          {tab === 'design' && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-[11px] text-[#555] mr-1">Themes (applied to all slides):</span>
              {THEMES.map((t, i) => (
                <button key={t.name} onClick={() => setTheme(i)} className={`${btn} ${theme === i ? 'ring-2 ring-[#B7472A]' : ''}`}>
                  <span className="inline-block w-3 h-3 mr-1 align-[-2px] rounded-sm border border-black/20" style={{ background: t.band || t.bg }} />
                  {t.name}
                </button>
              ))}
            </div>
          )}
          {tab === 'transitions' && (
            <>
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[11px] text-[#555] mr-1">Transition to slide {cur + 1}:</span>
                {(['None', 'Fade', 'Push', 'Wipe', 'Split', 'Cover', 'Uncover'] as TransName[]).map(n => (
                  <button key={n} onClick={() => patchSel({ transition: { ...sel.transition, name: n } })} className={`${btn} ${sel.transition.name === n ? 'ring-2 ring-[#B7472A]' : ''}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-[11.5px]">
                <label>
                  Effect Options{' '}
                  <select className={sel_} value={sel.transition.dir} disabled={!['Push', 'Wipe', 'Cover', 'Uncover'].includes(sel.transition.name)} onChange={e => patchSel({ transition: { ...sel.transition, dir: e.target.value as Dir } })}>
                    <option value="right">From Right</option>
                    <option value="left">From Left</option>
                    <option value="bottom">From Bottom</option>
                    <option value="top">From Top</option>
                  </select>
                </label>
                <label>
                  Duration{' '}
                  <select className={sel_} value={sel.transition.dur} onChange={e => patchSel({ transition: { ...sel.transition, dur: Number(e.target.value) } })}>
                    {[0.5, 0.7, 1, 1.5, 2, 3].map(d => (
                      <option key={d} value={d}>
                        {d.toFixed(2)} s
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Advance Slide{' '}
                  <select className={sel_} value={sel.after === undefined ? 'click' : String(sel.after)} onChange={e => patchSel({ after: e.target.value === 'click' ? undefined : Number(e.target.value) })}>
                    <option value="click">On Mouse Click</option>
                    {[2, 3, 5, 10].map(n => (
                      <option key={n} value={n}>
                        After {fmt(n)}
                      </option>
                    ))}
                  </select>
                </label>
                <button className={btn} onClick={() => applyToAll('transition')}>
                  Apply To All
                </button>
                <button className={btn} onClick={() => begin(cur)}>
                  ▶ Preview
                </button>
              </div>
            </>
          )}
          {tab === 'animations' && (
            <>
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-[11px] text-[#555] mr-1">Entrance effect for the text on slide {cur + 1}:</span>
                {(['None', 'Appear', 'Fade', 'Fly In', 'Wipe', 'Zoom'] as AnimName[]).map(n => (
                  <button key={n} disabled={!sel.bullets} onClick={() => patchSel({ anim: { ...sel.anim, name: n } })} className={`${btn} ${sel.anim.name === n ? 'ring-2 ring-[#B7472A]' : ''}`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-[11.5px]">
                <label>
                  Sequence{' '}
                  <select className={sel_} value={sel.anim.seq} onChange={e => patchSel({ anim: { ...sel.anim, seq: e.target.value as Anim['seq'] } })}>
                    <option value="paragraph">By Paragraph</option>
                    <option value="one">As One Object</option>
                  </select>
                </label>
                <label>
                  Start{' '}
                  <select className={sel_} value={sel.anim.start} onChange={e => patchSel({ anim: { ...sel.anim, start: e.target.value as Anim['start'] } })}>
                    <option value="click">On Click</option>
                    <option value="after">After Previous</option>
                  </select>
                </label>
                <button className={btn} onClick={() => applyToAll('anim')}>
                  Apply to all slides
                </button>
                <button className={btn} onClick={() => begin(cur)}>
                  ▶ Preview
                </button>
              </div>
              {!sel.bullets && <p className="text-[11px] text-[#777]">This slide has no bullet list — pick a content slide.</p>}
            </>
          )}
          {tab === 'show' && (
            <div className="flex flex-wrap gap-1 items-center">
              <button className={btn} onClick={() => begin(0)}>
                ▶ From Beginning (F5)
              </button>
              <button className={btn} onClick={() => begin(cur)}>
                ▶ From Current Slide (Shift+F5)
              </button>
              <button className={btn} onClick={() => begin(0, true)}>
                ⏱ Rehearse Timings
              </button>
              <label className="flex items-center gap-1 text-[11.5px] ml-1">
                <input type="checkbox" checked={useTimings} onChange={e => setUseTimings(e.target.checked)} /> Use Timings
              </label>
            </div>
          )}
        </div>

        {show ? (
          stage
        ) : (
          <>
            {(tab === 'transitions' || tab === 'animations' || tab === 'design') && (
              <div className="p-2 bg-[#d9d9d9]">
                <div className="relative w-full max-w-[520px] mx-auto shadow" style={{ aspectRatio: '16/9' }}>
                  {renderSlide(sel, { order: tab === 'animations' })}
                </div>
                {tab === 'animations' && sel.anim.name !== 'None' && (
                  <p className="text-center text-[10.5px] text-[#444] mt-1">{sel.anim.start === 'click' ? `The numbers show the click order: ${sel.anim.seq === 'one' ? 'all points appear on one click' : 'one point per click'}.` : 'After Previous: the points appear automatically, one after another.'}</p>
                )}
              </div>
            )}
            {thumbs}
          </>
        )}

        <div className="px-2 py-1 text-[10.5px] text-white flex justify-between gap-3" style={{ background: '#B7472A' }}>
          <span className="shrink-0 whitespace-nowrap">{show ? `SLIDE ${show.ended ? '—' : show.idx + 1} OF ${slides.length}` : `SLIDE ${cur + 1} OF ${slides.length}`}</span>
          <span className="truncate">{show ? (show.rehearse ? 'Rehearsing — timing each slide' : 'Slide Show') : THEMES[theme].name}</span>
        </div>
        {show && <p className="px-2 py-1 text-[10.5px] text-[#444] bg-[#f3f3f3]">Keys: N / → / Space = next · P / ← = back · B = black · W = white · number + Enter = go to slide · H = hidden slide · Esc = end. On a phone: tap the slide for next, use the round buttons for the rest.</p>}
      </div>

      {keepTimings && (
        <div className="mx-3 mb-3 p-3 rounded-lg border border-[#B7472A]/40 bg-[#fff6f3] text-[12.5px] text-[#222]">
          <p>
            <b>Microsoft PowerPoint:</b> The total time for the slide show was {fmt(rehearsalTotal)}. Do you want to keep the new slide timings?
          </p>
          <div className="flex gap-2 mt-2">
            <button
              className={btn}
              onClick={() => {
                edit(ss => ss.map((s, i) => (keepTimings[i] !== undefined ? { ...s, after: Math.max(1, keepTimings[i]) } : s)))
                setKeepTimings(null)
                setTab('sorter')
                setMsg('Timings saved — they appear under each thumbnail in Slide Sorter, and the show now advances by itself (untick Use Timings to go back to clicking).')
              }}
            >
              Yes
            </button>
            <button className={btn} onClick={() => setKeepTimings(null)}>
              No
            </button>
          </div>
        </div>
      )}
      {msg && (
        <p className="mx-3 mb-3 px-3 py-2 rounded-lg text-[12px] bg-brand-sky/10 border border-brand-sky/30" onClick={() => setMsg(null)}>
          {msg}
        </p>
      )}
    </div>
  )
}
