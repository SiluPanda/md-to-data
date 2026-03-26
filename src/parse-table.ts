import type { ParseTableOptions } from './types.js'
import { normalizeHeader, inferValue, stripMarkdown, splitLines } from './utils.js'

const TABLE_ROW_RE = /^\s*\|.+\|\s*$/
const SEPARATOR_RE = /^\s*\|[\s|:-]+\|\s*$/

function splitRow(line: string): string[] {
  // Remove leading/trailing pipe, then split on unescaped |
  const inner = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '')
  // Split on | that is NOT preceded by a backslash
  const cells: string[] = []
  let current = ''
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '\\' && i + 1 < inner.length && inner[i + 1] === '\\') {
      current += '\\'
      i++
    } else if (inner[i] === '\\' && i + 1 < inner.length && inner[i + 1] === '|') {
      current += '|'
      i++
    } else if (inner[i] === '|') {
      cells.push(current.trim())
      current = ''
    } else {
      current += inner[i]
    }
  }
  cells.push(current.trim())
  return cells
}

function extractTables(lines: string[]): string[][] {
  const tables: string[][] = []
  let current: string[] = []
  let inTable = false

  for (const line of lines) {
    if (TABLE_ROW_RE.test(line)) {
      inTable = true
      current.push(line)
    } else {
      if (inTable && current.length > 0) {
        tables.push(current)
        current = []
      }
      inTable = false
    }
  }
  if (inTable && current.length > 0) {
    tables.push(current)
  }
  return tables
}

export function parseTable(
  markdown: string,
  options?: ParseTableOptions,
): Record<string, unknown>[] {
  const tableIndex = options?.tableIndex ?? 0
  const headerNorm = options?.headerNormalization ?? 'camelCase'
  const inferOpts = options?.inference ?? {}

  const lines = splitLines(markdown)
  const tables = extractTables(lines)

  if (tables.length === 0 || tableIndex >= tables.length) {
    return []
  }

  const tableLines = tables[tableIndex]

  // First non-separator line is header
  const headerLine = tableLines[0]
  const headers = splitRow(headerLine).map(h =>
    normalizeHeader(stripMarkdown(h), headerNorm),
  )

  const rows: Record<string, unknown>[] = []

  for (let i = 1; i < tableLines.length; i++) {
    const line = tableLines[i]
    // Skip separator lines
    if (SEPARATOR_RE.test(line)) continue

    const cells = splitRow(line)
    const row: Record<string, unknown> = {}
    for (let j = 0; j < headers.length; j++) {
      const raw = j < cells.length ? stripMarkdown(cells[j]) : ''
      row[headers[j]] = inferValue(raw, inferOpts)
    }
    rows.push(row)
  }

  return rows
}
