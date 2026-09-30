'use client'

import { useState } from 'react'

// Weighted modulus-10 check digit as described in Valacich, George & Hoffer (Fig. 8-15):
// weights 1,2,1,2… applied from the rightmost digit, products summed, check = 10 − (sum mod 10).
function compute(digits: string) {
  const ds = digits.split('').map(Number)
  const rows = ds.map((d, i) => {
    const weight = (ds.length - 1 - i) % 2 === 0 ? 1 : 2
    return { d, weight, product: d * weight }
  })
  const sum = rows.reduce((s, r) => s + r.product, 0)
  const remainder = sum % 10
  const check = (10 - remainder) % 10
  return { rows, sum, remainder, check }
}

export default function CheckDigitCalculator({ start = '12473' }: { start?: string }) {
  const [base, setBase] = useState(start)
  const [code, setCode] = useState('142734')
  const clean = base.replace(/\D/g, '').slice(0, 12)
  const result = clean ? compute(clean) : null

  const cleanCode = code.replace(/\D/g, '').slice(0, 13)
  const verify = cleanCode.length >= 2 ? compute(cleanCode.slice(0, -1)) : null
  const valid = verify ? verify.check === Number(cleanCode.slice(-1)) : null

  return (
    <div className="not-prose my-6 rounded-2xl border border-brand-navy/10 dark:border-brand-cyan/15 bg-white dark:bg-brand-surface/60 p-4 text-brand-navy dark:text-white">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-deep dark:text-brand-sky mb-3">🔢 Check-digit calculator</p>

      <label className="block text-[11px] font-semibold text-brand-navy/60 dark:text-white/55 mb-1">Number to protect</label>
      <input
        value={base}
        onChange={e => setBase(e.target.value)}
        inputMode="numeric"
        className="w-full rounded-lg border border-brand-navy/15 dark:border-brand-cyan/20 bg-white dark:bg-brand-bg/60 px-3 py-2 text-[14px] font-mono tracking-widest outline-none"
      />

      {result && (
        <>
          <div className="mt-3 overflow-x-auto">
            <table className="text-[12px] font-mono">
              <tbody>
                <tr>
                  <td className="pr-3 text-brand-navy/55 dark:text-white/50 font-sans">Digit</td>
                  {result.rows.map((r, i) => <td key={i} className="px-2 text-center font-bold">{r.d}</td>)}
                </tr>
                <tr>
                  <td className="pr-3 text-brand-navy/55 dark:text-white/50 font-sans">× weight</td>
                  {result.rows.map((r, i) => <td key={i} className="px-2 text-center text-brand-deep dark:text-brand-sky">{r.weight}</td>)}
                </tr>
                <tr className="border-t border-brand-navy/10 dark:border-brand-cyan/10">
                  <td className="pr-3 text-brand-navy/55 dark:text-white/50 font-sans">Product</td>
                  {result.rows.map((r, i) => <td key={i} className="px-2 text-center">{r.product}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <ol className="mt-3 space-y-1 text-[12.5px] leading-relaxed list-decimal pl-5">
            <li>Weights alternate 1, 2, 1, 2 … starting from the <b>rightmost</b> digit.</li>
            <li>Sum of products = <b>{result.sum}</b></li>
            <li>{result.sum} ÷ 10 leaves remainder <b>{result.remainder}</b></li>
            <li>Check digit = 10 − {result.remainder} = <b>{result.check}</b>{result.remainder === 0 ? ' (a remainder of 0 gives check digit 0)' : ''}</li>
            <li>Stored value: <b className="font-mono text-[14px]">{clean}<span className="text-brand-deep dark:text-brand-sky">{result.check}</span></b></li>
          </ol>
        </>
      )}

      <div className="mt-4 pt-3 border-t border-brand-navy/10 dark:border-brand-cyan/10">
        <label className="block text-[11px] font-semibold text-brand-navy/60 dark:text-white/55 mb-1">
          Verify a code (last digit is the check digit) — try swapping two digits
        </label>
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          inputMode="numeric"
          className="w-full rounded-lg border border-brand-navy/15 dark:border-brand-cyan/20 bg-white dark:bg-brand-bg/60 px-3 py-2 text-[14px] font-mono tracking-widest outline-none"
        />
        {verify && (
          <p className={`mt-2 text-[12.5px] font-semibold ${valid ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {valid
              ? `✓ Valid — ${cleanCode.slice(0, -1)} produces check digit ${verify.check}.`
              : `✗ Invalid — ${cleanCode.slice(0, -1)} should end in ${verify.check}, not ${cleanCode.slice(-1)}. An entry or transmission error has occurred.`}
          </p>
        )}
      </div>
    </div>
  )
}
