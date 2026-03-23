import type { ParseKeyValueOptions } from './types.js'
import { normalizeHeader, inferValue, stripMarkdown, splitLines } from './utils.js'

// Matches: "**key**: value" or "key: value" or "key = value"
function buildLineRE(delimiters: string[]): RegExp {
  const escaped = delimiters.map(d => d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const delimGroup = escaped.join('|')
  // Non-greedy .+? finds the first delimiter occurrence; works for both
  // single-char (:, =) and multi-char (->) delimiters without character-class
  // escaping issues.
  return new RegExp(`^\\s*(?:\\*{2})?(.+?)(?:\\*{2})?\\s*(?:${delimGroup})\\s*(.*)$`)
}

export function parseKeyValue(
  markdown: string,
  options?: ParseKeyValueOptions,
): Record<string, unknown> {
  const delimiters = options?.delimiters ?? [':', '=']
  const headerNorm = options?.headerNormalization ?? 'camelCase'
  const inferOpts = options?.inference ?? {}

  const lineRE = buildLineRE(delimiters)
  const lines = splitLines(markdown)
  const result: Record<string, unknown> = {}

  let pendingKey: string | null = null

  for (const line of lines) {
    // Skip table rows
    if (line.trim().startsWith('|')) continue
    // Skip headings
    if (/^\s*#{1,6}\s/.test(line)) continue
    // Skip blank lines
    if (line.trim() === '') {
      pendingKey = null
      continue
    }

    // Handle definition-list style: previous line was **key**, this line is ": value"
    if (pendingKey !== null && /^\s*:\s+(.+)$/.test(line)) {
      const m = /^\s*:\s+(.+)$/.exec(line)
      if (m) {
        const raw = stripMarkdown(m[1].trim())
        result[pendingKey] = inferValue(raw, inferOpts)
        pendingKey = null
        continue
      }
    }

    // Check if this line is a standalone bold key (definition list header)
    const boldKeyMatch = /^\s*\*\*([^*]+)\*\*\s*$/.exec(line)
    if (boldKeyMatch) {
      pendingKey = normalizeHeader(stripMarkdown(boldKeyMatch[1]), headerNorm)
      continue
    }

    pendingKey = null

    const m = lineRE.exec(line)
    if (m) {
      const rawKey = m[1].replace(/\*\*/g, '').trim()
      const rawVal = m[2].trim()
      const key = normalizeHeader(stripMarkdown(rawKey), headerNorm)
      result[key] = inferValue(stripMarkdown(rawVal), inferOpts)
    }
  }

  return result
}
