import type { Parser, ParseTableOptions, ParseListOptions, ParseKeyValueOptions, ParseSectionOptions, ParseResult } from './types.js'
import { parse } from './parse.js'
import { parseTable } from './parse-table.js'
import { parseList } from './parse-list.js'
import { parseKeyValue } from './parse-key-value.js'
import { parseSections } from './parse-sections.js'

export interface ParserDefaults {
  tableOptions?: ParseTableOptions
  listOptions?: ParseListOptions
  keyValueOptions?: ParseKeyValueOptions
  sectionOptions?: ParseSectionOptions
}

export function createParser(defaults?: ParserDefaults): Parser {
  return {
    parse(markdown: string): ParseResult {
      return parse(markdown)
    },

    parseTable(markdown: string, options?: ParseTableOptions) {
      return parseTable(markdown, { ...defaults?.tableOptions, ...options })
    },

    parseList(markdown: string, options?: ParseListOptions) {
      return parseList(markdown, { ...defaults?.listOptions, ...options })
    },

    parseKeyValue(markdown: string, options?: ParseKeyValueOptions) {
      return parseKeyValue(markdown, { ...defaults?.keyValueOptions, ...options })
    },

    parseSections(markdown: string, options?: ParseSectionOptions) {
      return parseSections(markdown, { ...defaults?.sectionOptions, ...options })
    },
  }
}
