import type { ParseSectionOptions } from './types.js'
import { splitLines, stripMarkdown } from './utils.js'

const HEADING_RE = /^(#{1,6})\s+(.+)$/

export function parseSections(
  markdown: string,
  options?: ParseSectionOptions,
): Record<string, string> {
  const minLevel = options?.minLevel ?? 1
  const maxLevel = options?.maxLevel ?? 6

  const lines = splitLines(markdown)
  const result: Record<string, string> = {}

  let currentKey: string | null = null
  let contentLines: string[] = []

  function flush() {
    if (currentKey !== null) {
      result[currentKey] = contentLines.join('\n').trim()
    }
  }

  for (const line of lines) {
    const m = HEADING_RE.exec(line)
    if (m) {
      const level = m[1].length
      if (level >= minLevel && level <= maxLevel) {
        flush()
        currentKey = stripMarkdown(m[2].trim())
        contentLines = []
        continue
      }
    }
    if (currentKey !== null) {
      contentLines.push(line)
    }
  }

  flush()

  return result
}
