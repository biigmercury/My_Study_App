'use client'

import { useState } from 'react'

// WCAG 2.1 relative luminance and contrast ratio (success criteria 1.4.3 and 1.4.6).
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v)

const PRESETS: [string, string, string][] = [
  ['Mid-grey on white', '#767676', '#FFFFFF'],
  ['Light grey on white', '#AAAAAA', '#FFFFFF'],
  ['Yellow on white', '#FFD700', '#FFFFFF'],
  ['White on navy', '#FFFFFF', '#03045E'],
  ['Red on green', '#D32F2F', '#388E3C'],
]

function Badge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 text-center ${pass ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
      <p className="text-[10px] font-semibold text-brand-navy/60 dark:text-white/55">{label}</p>
      <p className={`text-[12px] font-bold ${pass ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{pass ? 'Pass' : 'Fail'}</p>
    </div>
  )
}

function ColourField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-brand-navy/60 dark:text-white/55">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-brand-navy/15 dark:border-brand-cyan/20 bg-white dark:bg-brand-bg/60 px-2 py-1">
        <input type="color" value={isHex(value) ? value : '#000000'} onChange={e => onChange(e.target.value.toUpperCase())} className="w-7 h-7 bg-transparent border-0 p-0" />
        <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-transparent text-[13px] font-mono uppercase text-brand-navy dark:text-white outline-none" />
      </div>
    </label>
  )
}

export default function ContrastChecker() {
  const [fg, setFg] = useState('#767676')
  const [bg, setBg] = useState('#FFFFFF')
  const valid = isHex(fg) && isHex(bg)
  const r = valid ? ratio(fg, bg) : 0

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 p-4 text-brand-navy dark:text-white">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky mb-3">🎨 WCAG contrast checker</p>

      <div className="grid grid-cols-2 gap-2.5">
        <ColourField label="Text colour" value={fg} onChange={setFg} />
        <ColourField label="Background colour" value={bg} onChange={setBg} />
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {PRESETS.map(([name, f, b]) => (
          <button
            key={name}
            onClick={() => { setFg(f); setBg(b) }}
            className="px-2 py-1 rounded-md text-[10.5px] font-semibold border border-brand-navy/10 dark:border-brand-cyan/15 text-brand-navy/70 dark:text-white/70"
          >
            {name}
          </button>
        ))}
      </div>

      {valid ? (
        <>
          <div className="mt-3 rounded-xl p-3 border border-brand-navy/10" style={{ background: bg, color: fg }}>
            <p className="text-[13px]">Normal text: Your registration was successful.</p>
            <p className="text-[19px] font-bold mt-1">Large text: Pay ₦25,000</p>
          </div>
          <p className="mt-3 text-center text-[22px] font-bold">{r.toFixed(2)} : 1</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Badge label="AA normal text (4.5:1)" pass={r >= 4.5} />
            <Badge label="AA large text (3:1)" pass={r >= 3} />
            <Badge label="AAA normal text (7:1)" pass={r >= 7} />
            <Badge label="AAA large text (4.5:1)" pass={r >= 4.5} />
          </div>
          <p className="mt-2 text-[11px] text-brand-navy/55 dark:text-white/50 leading-relaxed">
            Large text = at least 18pt, or 14pt bold. Buttons, icons and form borders need at least 3:1 against their surroundings (WCAG 1.4.11).
          </p>
        </>
      ) : (
        <p className="mt-3 text-[12px] text-red-600 dark:text-red-400">Enter colours as six-digit hex codes, e.g. #03045E.</p>
      )}
    </div>
  )
}
