import type { HeaderNormalization, InferenceOptions } from './types.js'

export function normalizeHeader(header: string, style: HeaderNormalization): string {
  const trimmed = header.trim()
  if (style === 'preserve') {
    return trimmed
  }
  if (style === 'lowercase') {
    return trimmed.toLowerCase()
  }
  // Split on whitespace, hyphens, underscores for camelCase/snake_case/kebab-case
  const words = trimmed
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(w => w.toLowerCase())

  if (style === 'snake_case') {
    return words.join('_')
  }
  if (style === 'kebab-case') {
    return words.join('-')
  }
  // camelCase (default)
  return words
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('')
}

export function inferValue(raw: string, options: InferenceOptions): unknown {
  if (options.enabled === false) {
    return raw
  }
  const trimmed = raw.trim()

  // Nulls
  if (options.nulls !== false) {
    if (
      trimmed === '' ||
      trimmed.toLowerCase() === 'null' ||
      trimmed.toLowerCase() === 'n/a' ||
      trimmed === '-' ||
      trimmed.toLowerCase() === 'none' ||
      trimmed.toLowerCase() === 'nil'
    ) {
      return null
    }
  }

  // Booleans
  if (options.booleans !== false) {
    const lower = trimmed.toLowerCase()
    if (lower === 'true' || lower === 'yes') return true
    if (lower === 'false' || lower === 'no') return false
  }

  // Numbers
  if (options.numbers !== false && trimmed !== '') {
    const n = Number(trimmed)
    if (!isNaN(n) && trimmed !== '') {
      return n
    }
  }

  return trimmed
}

export function stripMarkdown(text: string): string {
  return text
    // links: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // bold+italic: ***text*** or ___text___
    .replace(/\*{3}([^*]+)\*{3}/g, '$1')
    .replace(/_{3}([^_]+)_{3}/g, '$1')
    // bold: **text** or __text__
    .replace(/\*{2}([^*]+)\*{2}/g, '$1')
    .replace(/_{2}([^_]+)_{2}/g, '$1')
    // italic: *text* or _text_
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // inline code: `code`
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

export function splitLines(text: string): string[] {
  return text.split('\n').map(l => l.trimEnd())
}
