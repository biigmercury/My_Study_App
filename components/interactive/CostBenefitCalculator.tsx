'use client'

import { useState } from 'react'

interface CostBenefitCalculatorProps {
  initialCost?: string
  annualBenefit?: string
  annualCost?: string
  years?: string
  rate?: string
}

const naira = (n: number) =>
  (n < 0 ? '−₦' : '₦') + Math.abs(Math.round(n)).toLocaleString('en-NG')

function Field({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-brand-navy/60 dark:text-white/55">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border border-brand-navy/15 dark:border-brand-cyan/20 bg-white dark:bg-brand-bg/60 px-2">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={0}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent py-1.5 text-[13px] text-brand-navy dark:text-white outline-none"
        />
        {suffix && <span className="text-[11px] text-brand-navy/50 dark:text-white/45">{suffix}</span>}
      </div>
    </label>
  )
}

// Payback, ROI and NPV for a one-off development cost followed by constant yearly benefits and running costs.
export default function CostBenefitCalculator({
  initialCost = '12000000',
  annualBenefit = '6000000',
  annualCost = '1500000',
  years = '5',
  rate = '10',
}: CostBenefitCalculatorProps) {
  const [cost0, setCost0] = useState(parseFloat(initialCost))
  const [benefit, setBenefit] = useState(parseFloat(annualBenefit))
  const [running, setRunning] = useState(parseFloat(annualCost))
  const [n, setN] = useState(parseInt(years, 10))
  const [r, setR] = useState(parseFloat(rate))

  const horizon = Math.max(1, Math.min(15, Math.round(n)))
  const net = benefit - running

  let cumulative = -cost0
  let npv = -cost0
  let payback: number | null = null
  const rows = Array.from({ length: horizon }, (_, i) => {
    const year = i + 1
    const factor = 1 / Math.pow(1 + r / 100, year)
    const pv = net * factor
    const before = cumulative
    cumulative += net
    npv += pv
    if (payback === null && before < 0 && cumulative >= 0 && net > 0) payback = i + -before / net
    return { year, net, factor, pv, cumulative }
  })
  if (payback === null && cost0 <= 0) payback = 0

  const totalBenefit = benefit * horizon
  const totalCost = cost0 + running * horizon
  const roi = totalCost > 0 ? ((totalBenefit - totalCost) / totalCost) * 100 : 0

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky mb-3">
        🧮 Cost-benefit calculator
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Development (year 0) cost" value={cost0} onChange={setCost0} suffix="₦" />
        <Field label="Yearly benefits" value={benefit} onChange={setBenefit} suffix="₦" />
        <Field label="Yearly running cost" value={running} onChange={setRunning} suffix="₦" />
        <Field label="Discount rate" value={r} onChange={setR} suffix="%" />
        <Field label="Years to evaluate" value={n} onChange={setN} suffix="yrs" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          ['Payback', payback === null ? 'Never' : `${(payback as number).toFixed(2)} yrs`],
          ['ROI', `${roi.toFixed(1)}%`],
          ['NPV', naira(npv)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-brand-mist/60 dark:bg-brand-bg/60 px-2.5 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase text-brand-navy/55 dark:text-white/50">{k}</p>
            <p className={`text-[13px] font-bold ${k === 'NPV' && npv < 0 ? 'text-red-600 dark:text-red-400' : 'text-brand-navy dark:text-white'}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[11px] text-brand-navy/80 dark:text-white/75">
          <thead>
            <tr className="text-left text-brand-navy dark:text-white">
              <th className="py-1 pr-2">Yr</th>
              <th className="py-1 pr-2">Net benefit</th>
              <th className="py-1 pr-2">Discount factor</th>
              <th className="py-1 pr-2">Present value</th>
              <th className="py-1">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-brand-navy/10 dark:border-brand-cyan/10">
              <td className="py-1 pr-2">0</td>
              <td className="py-1 pr-2">{naira(-cost0)}</td>
              <td className="py-1 pr-2">1.000</td>
              <td className="py-1 pr-2">{naira(-cost0)}</td>
              <td className="py-1">{naira(-cost0)}</td>
            </tr>
            {rows.map(row => (
              <tr key={row.year} className="border-t border-brand-navy/10 dark:border-brand-cyan/10">
                <td className="py-1 pr-2">{row.year}</td>
                <td className="py-1 pr-2">{naira(row.net)}</td>
                <td className="py-1 pr-2">{row.factor.toFixed(3)}</td>
                <td className="py-1 pr-2">{naira(row.pv)}</td>
                <td className={`py-1 ${row.cumulative < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{naira(row.cumulative)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-brand-navy/55 dark:text-white/50">
        Payback = years until cumulative net benefit reaches zero. ROI = (total benefits − total costs) ÷ total costs × 100.
        NPV = −initial cost + Σ net benefitₜ ÷ (1 + r)ᵗ. A project is economically feasible when NPV &gt; 0.
      </p>
    </div>
  )
}
