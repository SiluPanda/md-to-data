import type { ParseListOptions, CheckboxItem } from './types.js'
import { inferValue, stripMarkdown, splitLines } from './utils.js'

const UNORDERED_RE = /^(\s*)([-*+])\s+(.*)$/
const ORDERED_RE = /^(\s*)\d+\.\s+(.*)$/
const CHECKBOX_RE = /^(\s*)([-*+])\s+\[([ xX])\]\s+(.*)$/

export function parseList(
  markdown: string,
  options?: ParseListOptions,
): Array<string | CheckboxItem> {
  const inferOpts = options?.inference ?? {}

  const lines = splitLines(markdown)
  const results: Array<string | CheckboxItem> = []

  for (const line of lines) {
    // Check checkbox first
    const cbMatch = CHECKBOX_RE.exec(line)
    if (cbMatch) {
      const checked = cbMatch[3].toLowerCase() === 'x'
      const text = stripMarkdown(cbMatch[4])
      results.push({ text, checked })
      continue
    }

    // Unordered
    const ulMatch = UNORDERED_RE.exec(line)
    if (ulMatch) {
      const raw = stripMarkdown(ulMatch[3])
      const value = inferValue(raw, inferOpts)
      results.push(typeof value === 'string' ? value : String(value))
      continue
    }

    // Ordered
    const olMatch = ORDERED_RE.exec(line)
    if (olMatch) {
      const raw = stripMarkdown(olMatch[2])
      const value = inferValue(raw, inferOpts)
      results.push(typeof value === 'string' ? value : String(value))
      continue
    }
  }

  return results
}
