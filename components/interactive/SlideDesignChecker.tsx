'use client'

import { useState } from 'react'

// Live slide-design checker for the CSC 272 design rules: every slide has a title, the 6 × 6 rule,
// no ALL CAPS, readable font and size, title bigger than body text, strong text/background contrast,
// consistent bullets. Presets reproduce the "History of UI" before/after example from the tutorial.

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const FONTS: [string, string, boolean][] = [
  ['Calibri', 'Calibri, Carlito, Arial, sans-serif', true],
  ['Arial', 'Arial, Helvetica, sans-serif', true],
  ['Segoe UI', '"Segoe UI", Arial, sans-serif', true],
  ['Times New Roman', '"Times New Roman", Times, serif', true],
  ['Comic Sans MS', '"Comic Sans MS", "Comic Neue", cursive', false],
  ['Brush Script MT', '"Brush Script MT", "Segoe Script", cursive', false],
]

interface Slide {
  title: string
  bullets: string
  bg: string
  fg: string
  titleColor: string
  font: string
  size: number
  titleSize: number
}

const HISTORY_BAD: Slide = {
  title: 'Sample: History of UI',
  bullets:
    'The University of Ibadan was Established in 1948. The University of Ibadan, UI as it is fondly referred to, is the first University in Nigeria. Until 1962 when it became a full-fledged independent University, it was a College of the University of London in a special relationship scheme. The University, which took off with academic programmes in Arts, Science and Medicine, is now a comprehensive citadel of learning with academic programmes in sixteen Faculties.',
  bg: '#1F3A5F',
  fg: '#4A6A8F',
  titleColor: '#8FA9C6',
  font: 'Times New Roman',
  size: 18,
  titleSize: 20,
}
const HISTORY_GOOD: Slide = {
  title: 'History of UI',
  bullets: 'Established in 1948\nCollege of the University of London\nIndependent university since 1962\nFounding faculties: Arts, Science, Medicine\nNow sixteen faculties\nAlso runs postgraduate programmes',
  bg: '#FFFFFF',
  fg: '#1F2937',
  titleColor: '#1F3A5F',
  font: 'Calibri',
  size: 28,
  titleSize: 44,
}
const SHOUTY: Slide = {
  title: '',
  bullets: 'WE WILL LOOK AT THE VARIOUS DIFFERENT REASONS WHY STUDENTS FAIL EXAMS\nPOOR TIME MANAGEMENT\nNOT ATTENDING LECTURES REGULARLY AT ALL\nLACK OF ADEQUATE SLEEP BEFORE THE EXAMINATION DAY\nEXAM MALPRACTICE\nSTRESS\nPHONES\nFRIENDS',
  bg: '#FFFF00',
  fg: '#FFFFFF',
  titleColor: '#FF0000',
  font: 'Brush Script MT',
  size: 20,
  titleSize: 20,
}

export default function SlideDesignChecker() {
  const [s, setS] = useState<Slide>(HISTORY_BAD)
  const set = (patch: Partial<Slide>) => setS(prev => ({ ...prev, ...patch }))

  const items = s.bullets
    .split('\n')
    .map(b => b.trim())
    .filter(Boolean)
  const words = (t: string) => t.split(/\s+/).filter(Boolean).length
  const long = items.filter(b => words(b) > 6)
  const letters = (s.title + s.bullets).replace(/[^A-Za-z]/g, '')
  const caps = letters.length > 8 && letters === letters.toUpperCase()
  const ratio = contrast(s.bg, s.fg)
  const titleRatio = contrast(s.bg, s.titleColor)
  const font = FONTS.find(f => f[0] === s.font) ?? FONTS[0]
  const endsDot = items.map(b => /[.!?]$/.test(b))
  const consistent = endsDot.every(x => x === endsDot[0])

  const checks: { ok: boolean; rule: string; why: string }[] = [
    { ok: s.title.trim() !== '', rule: 'Every slide has a title', why: s.title.trim() ? 'The title tells the audience what the slide is about.' : 'Add a short title — the audience should know the topic at a glance.' },
    { ok: items.length > 0 && items.length <= 6, rule: 'Six or fewer items (6 × 6 rule)', why: `${items.length} item${items.length === 1 ? '' : 's'} on the slide.${items.length > 6 ? ' Split it into two slides or cut the weakest points.' : ''}` },
    { ok: long.length === 0, rule: 'Six or fewer words per item (6 × 6 rule)', why: long.length ? `${long.length} item${long.length === 1 ? ' has' : 's have'} more than 6 words — e.g. "${long[0].slice(0, 60)}${long[0].length > 60 ? '…' : ''}" (${words(long[0])} words). Keep phrases, drop articles, pronouns and extra adjectives.` : 'Short phrases — the slide supports your talk instead of replacing it.' },
    { ok: !caps, rule: 'Avoid ALL CAPITAL LETTERS', why: caps ? 'All-caps text is harder to read and looks like shouting.' : 'Mixed case is easier to read.' },
    { ok: ratio >= 4.5 && titleRatio >= 3, rule: 'Background contrasts with the text', why: `Text contrast ${ratio.toFixed(1)}:1, title ${titleRatio.toFixed(1)}:1 — aim for at least 4.5:1 (dark text on a light background or light on dark).` },
    { ok: s.size >= 24, rule: 'Text large enough to read from the back', why: `Body text is ${s.size} pt. Use at least 24 pt for body text on slides.` },
    { ok: s.titleSize > s.size, rule: 'Headings larger than sub-points', why: `Title ${s.titleSize} pt vs body ${s.size} pt.` },
    { ok: font[2], rule: 'Plain, readable font', why: font[2] ? `${font[0]} is clear and professional.` : `${font[0]} is decorative — hard to read at a distance and unprofessional for most talks.` },
    { ok: consistent, rule: 'Consistent, parallel bullet points', why: consistent ? 'Punctuation is consistent across the points.' : 'Some points end with a full stop and others do not — keep the list parallel (all phrases, or all sentences).' },
  ]
  const score = checks.filter(c => c.ok).length

  const field = 'w-full rounded-md border border-brand-navy/15 dark:border-white/20 bg-white dark:bg-brand-surface px-2 py-1 text-[12.5px] text-brand-navy dark:text-white'

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 overflow-hidden text-brand-navy dark:text-white">
      <div className="flex flex-wrap items-center justify-between px-4 pt-3 gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky">🖼️ Slide design checker</p>
        <div className="flex gap-2 text-[11px] font-semibold text-brand-deep dark:text-brand-sky">
          <button onClick={() => setS(HISTORY_BAD)}>History of UI: before</button>
          <button onClick={() => setS(HISTORY_GOOD)}>after</button>
          <button onClick={() => setS(SHOUTY)}>Worst slide</button>
        </div>
      </div>

      <div className="p-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="relative w-full rounded-md border border-black/15 shadow-sm overflow-hidden" style={{ aspectRatio: '16 / 9', background: s.bg, containerType: 'inline-size', fontFamily: font[1] }}>
            <div style={{ position: 'absolute', inset: '6% 6% 4% 6%', display: 'flex', flexDirection: 'column' }}>
              {s.title.trim() && (
                <p style={{ color: s.titleColor, fontSize: `calc(${s.titleSize} * 100cqw / 960)`, lineHeight: 1.1, fontWeight: 400, marginBottom: '3cqw' }}>{s.title}</p>
              )}
              <ul style={{ color: s.fg, fontSize: `calc(${s.size} * 100cqw / 960)`, lineHeight: 1.25, listStyle: 'disc', paddingLeft: '1.2em', overflow: 'hidden' }}>
                {items.map((b, i) => (
                  <li key={i} style={{ marginBottom: '0.35em' }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-1 text-[10.5px] text-brand-navy/60 dark:text-white/60">Preview of a 16:9 slide, drawn to scale — imagine it on a projector at the front of a lecture theatre.</p>
        </div>

        <div className="space-y-2 text-[12px]">
          <label className="block">
            <span className="font-semibold">Title</span>
            <input value={s.title} onChange={e => set({ title: e.target.value })} className={field} />
          </label>
          <label className="block">
            <span className="font-semibold">Bullet points (one per line)</span>
            <textarea value={s.bullets} onChange={e => set({ bullets: e.target.value })} rows={5} className={`${field} font-[inherit]`} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="font-semibold">Font</span>
              <select value={s.font} onChange={e => set({ font: e.target.value })} className={field}>
                {FONTS.map(f => (
                  <option key={f[0]}>{f[0]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-semibold">Body / title size</span>
              <div className="flex gap-1">
                <select value={s.size} onChange={e => set({ size: Number(e.target.value) })} className={field} aria-label="Body text size">
                  {[14, 18, 20, 24, 28, 32].map(n => (
                    <option key={n} value={n}>
                      {n} pt
                    </option>
                  ))}
                </select>
                <select value={s.titleSize} onChange={e => set({ titleSize: Number(e.target.value) })} className={field} aria-label="Title size">
                  {[20, 28, 32, 36, 40, 44, 54].map(n => (
                    <option key={n} value={n}>
                      {n} pt
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            {(
              [
                ['bg', 'Background'],
                ['fg', 'Text'],
                ['titleColor', 'Title'],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="flex items-center gap-1.5">
                <input type="color" value={s[k]} onChange={e => set({ [k]: e.target.value } as Partial<Slide>)} className="h-7 w-9 rounded border border-brand-navy/15" />
                {l}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="px-3 pb-3">
        <p className="text-[12px] font-bold mb-1.5">
          Design rules passed: {score} / {checks.length} {score === checks.length ? '🎉' : ''}
        </p>
        <ul className="space-y-1">
          {checks.map(c => (
            <li key={c.rule} className={`px-2.5 py-1.5 rounded-lg text-[12px] border ${c.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-700' : 'border-rose-300 bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-100 dark:border-rose-700'}`}>
              <b>
                {c.ok ? '✓' : '✗'} {c.rule}
              </b>{' '}
              — {c.why}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
