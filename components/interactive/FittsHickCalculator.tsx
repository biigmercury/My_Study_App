'use client'

import { useState } from 'react'

// Formulas as taught in INS 202 Lecture 3:
//   Fitts's Law  T = a + b · log2(2D / W)
//   Hick's Law   T = b · log2(n + 1)

function Num({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-brand-navy/60 dark:text-white/55">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border border-brand-navy/15 dark:border-brand-cyan/20 bg-white dark:bg-brand-bg/60 px-2">
        <input
          type="number"
          min={0}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent py-1.5 text-[13px] text-brand-navy dark:text-white outline-none"
        />
        <span className="text-[11px] text-brand-navy/50 dark:text-white/45">{suffix}</span>
      </div>
    </label>
  )
}

export default function FittsHickCalculator() {
  const [tab, setTab] = useState<'fitts' | 'hick'>('fitts')
  const [d, setD] = useState(200)
  const [w, setW] = useState(100)
  const [a, setA] = useState(50)
  const [bF, setBF] = useState(150)
  const [n, setN] = useState(4)
  const [bH, setBH] = useState(200)

  const ratio = w > 0 ? (2 * d) / w : 0
  const id = ratio > 0 ? Math.log2(ratio) : 0
  const tF = a + bF * id
  const logH = Math.log2(n + 1)
  const tH = bH * logH

  // Scale the distance/width picture so it fits a 300px track.
  const scale = d + w > 0 ? 300 / Math.max(d + w / 2, 1) : 1

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 p-4 text-brand-navy dark:text-white">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky mb-3">⏱️ Fitts’s &amp; Hick’s Law calculator</p>

      <div className="flex gap-1 p-1 rounded-lg bg-brand-soft dark:bg-brand-bg/60 mb-3">
        {(['fitts', 'hick'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold ${tab === t ? 'bg-white dark:bg-brand-surface text-brand-deep dark:text-brand-sky shadow-sm' : 'text-brand-navy/55 dark:text-white/50'}`}
          >
            {t === 'fitts' ? "Fitts's Law (pointing)" : "Hick's Law (choosing)"}
          </button>
        ))}
      </div>

      {tab === 'fitts' ? (
        <>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            <button onClick={() => { setD(200); setW(100); setA(50); setBF(150) }} className="px-2 py-1 rounded-md text-[10.5px] font-semibold border border-brand-navy/10 dark:border-brand-cyan/15">Button A (100px)</button>
            <button onClick={() => { setD(200); setW(20); setA(50); setBF(150) }} className="px-2 py-1 rounded-md text-[10.5px] font-semibold border border-brand-navy/10 dark:border-brand-cyan/15">Button B (20px)</button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Num label="Distance to target D" value={d} onChange={setD} suffix="px" />
            <Num label="Target width W" value={w} onChange={setW} suffix="px" />
            <Num label="Constant a" value={a} onChange={setA} suffix="ms" />
            <Num label="Constant b" value={bF} onChange={setBF} suffix="ms" />
          </div>

          <div className="mt-3 relative h-12 rounded-lg bg-brand-mist/50 dark:bg-brand-bg/50 overflow-hidden">
            <div className="absolute top-1/2 -translate-y-1/2 left-2 w-3 h-3 rounded-full bg-brand-navy dark:bg-white" title="start" />
            <div className="absolute top-1/2 h-px bg-brand-navy/30 dark:bg-white/30" style={{ left: 14, width: Math.max(0, d * scale - (w * scale) / 2) }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md bg-brand-gradient"
              style={{ left: 14 + d * scale - (w * scale) / 2, width: Math.max(3, w * scale) }}
              title="target"
            />
          </div>

          {ratio >= 1 ? (
            <ol className="mt-3 space-y-1 text-[12.5px] list-decimal pl-5">
              <li>2D ÷ W = 2 × {d} ÷ {w} = <b>{ratio.toFixed(2)}</b></li>
              <li>log₂({ratio.toFixed(2)}) = <b>{id.toFixed(3)}</b> bits (index of difficulty)</li>
              <li>T = {a} + {bF} × {id.toFixed(3)} = <b className="text-[14px]">{Math.round(tF)} ms</b></li>
            </ol>
          ) : (
            <p className="mt-3 text-[12px] text-red-600 dark:text-red-400">This form of Fitts’s Law assumes 2D ÷ W is at least 1 (the target is no wider than twice its distance).</p>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            <button onClick={() => { setN(4); setBH(200) }} className="px-2 py-1 rounded-md text-[10.5px] font-semibold border border-brand-navy/10 dark:border-brand-cyan/15">Kiosk: 4 choices</button>
            <button onClick={() => { setN(16); setBH(200) }} className="px-2 py-1 rounded-md text-[10.5px] font-semibold border border-brand-navy/10 dark:border-brand-cyan/15">Kiosk: 16 choices</button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Num label="Number of choices n" value={n} onChange={v => setN(Math.max(0, Math.round(v)))} suffix="items" />
            <Num label="Constant b" value={bH} onChange={setBH} suffix="ms" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {Array.from({ length: Math.min(n, 40) }, (_, i) => (
              <span key={i} className="w-6 h-6 rounded-md bg-brand-gradient text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
            ))}
            {n > 40 && <span className="text-[11px] self-center">… +{n - 40}</span>}
          </div>
          <ol className="mt-3 space-y-1 text-[12.5px] list-decimal pl-5">
            <li>n + 1 = {n} + 1 = <b>{n + 1}</b></li>
            <li>log₂({n + 1}) = <b>{logH.toFixed(3)}</b></li>
            <li>T = {bH} × {logH.toFixed(3)} = <b className="text-[14px]">{Math.round(tH)} ms</b></li>
          </ol>
          <p className="mt-2 text-[11px] text-brand-navy/55 dark:text-white/50">
            Doubling the choices does not double the time — decision time grows logarithmically. But every extra option still costs time.
          </p>
        </>
      )}
    </div>
  )
}
