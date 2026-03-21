import type { ParseResult, CheckboxItem } from './types.js'
import { parseTable } from './parse-table.js'
import { parseList } from './parse-list.js'
import { parseKeyValue } from './parse-key-value.js'
import { parseSections } from './parse-sections.js'
import { splitLines } from './utils.js'

const TABLE_ROW_RE = /^\s*\|.+\|\s*$/

function countTables(markdown: string): number {
  const lines = splitLines(markdown)
  let count = 0
  let inTable = false
  for (const line of lines) {
    if (TABLE_ROW_RE.test(line)) {
      if (!inTable) {
        count++
        inTable = true
      }
    } else {
      inTable = false
    }
  }
  return count
}

const UNORDERED_RE = /^(\s*)([-*+])\s+(.*)$/
const ORDERED_RE = /^(\s*)\d+\.\s+(.*)$/

/**
 * Split markdown into separate list blocks (separated by blank lines or non-list content).
 */
function extractListBlocks(markdown: string): string[] {
  const lines = splitLines(markdown)
  const blocks: string[] = []
  let current: string[] = []

  for (const line of lines) {
    const isListLine = UNORDERED_RE.test(line) || ORDERED_RE.test(line)
    if (isListLine) {
      current.push(line)
    } else if (line.trim() === '' && current.length > 0) {
      blocks.push(current.join('\n'))
      current = []
    } else if (!isListLine && current.length > 0) {
      // Non-list, non-blank line ends a list block
      blocks.push(current.join('\n'))
      current = []
    }
  }
  if (current.length > 0) {
    blocks.push(current.join('\n'))
  }
  return blocks
}

export function parse(markdown: string): ParseResult {
  // Tables
  const tableCount = countTables(markdown)
  const tables: Record<string, unknown>[][] = []
  for (let i = 0; i < tableCount; i++) {
    tables.push(parseTable(markdown, { tableIndex: i }))
  }

  // Lists — split into blocks and parse each
  const listBlocks = extractListBlocks(markdown)
  const lists = listBlocks.map(block => {
    const items = parseList(block)
    return items as string[] | CheckboxItem[]
  })

  // Key-value
  const kv = parseKeyValue(markdown)
  const keyValues = Object.keys(kv).length > 0 ? [kv] : []

  // Sections
  const sections = parseSections(markdown)

  return {
    tables,
    lists,
    keyValues,
    sections,
    raw: markdown,
  }
}
