// usage: node scripts/check-dollars.mjs <file.mdx…>
// Lists lines where a `$` appears outside code (fences, inline code, JSX string attributes).
// remark-math treats $…$ in prose as maths, so a stray PHP variable would silently become a formula.
// Intentional maths like $x^2$ is reported too — just confirm those lines are meant to be maths.
import { readFileSync } from 'fs'

for (const file of process.argv.slice(2)) {
  const lines = readFileSync(file, 'utf8').split('\n')
  let fence = false
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence
      return
    }
    if (fence) return
    const prose = line
      .replace(/``[^`]*``|`[^`]*`/g, '')
      .replace(/\b[a-z]+="[^"]*"/g, '')
      .replace(/\\\$/g, '') // an escaped \$ is a literal dollar sign, not maths
    if (prose.includes('$')) console.log(`${file}:${i + 1}: ${line.trim().slice(0, 140)}`)
  })
}
