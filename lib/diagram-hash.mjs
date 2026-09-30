// Shared by components/DiagramBlock.tsx and scripts/render-diagrams.mjs so both derive the same
// file name and URL for a mermaid chart.
import { createHash } from 'crypto'

export function diagramHash(chart) {
  return createHash('sha1').update(chart.trim()).digest('hex').slice(0, 16)
}

export function mermaidInkUrl(chart) {
  const encoded = Buffer.from(chart.trim())
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `https://mermaid.ink/img/${encoded}`
}
