// Shared by components/DiagramBlock.tsx and scripts/render-diagrams.mjs so both derive the same
// file name and URL for a mermaid chart.
import { createHash } from 'crypto'

// Line endings are normalised so a lesson checked out with CRLF (Windows, core.autocrlf) hashes the
// same as the LF copy that production builds from.
const normalise = chart => chart.replace(/\r\n?/g, '\n').trim()

export function diagramHash(chart) {
  return createHash('sha1').update(normalise(chart)).digest('hex').slice(0, 16)
}

export function mermaidInkUrl(chart) {
  const encoded = Buffer.from(normalise(chart))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `https://mermaid.ink/img/${encoded}`
}
