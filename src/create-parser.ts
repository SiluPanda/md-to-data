import type { Parser, ParseTableOptions, ParseListOptions, ParseKeyValueOptions, ParseSectionOptions, ParseResult, InferenceOptions } from './types.js'
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

function mergeInference(
  base?: InferenceOptions,
  override?: InferenceOptions,
): InferenceOptions | undefined {
  if (!base && !override) return undefined
  if (!base) return override
  if (!override) return base
  return { ...base, ...override }
}

export function createParser(defaults?: ParserDefaults): Parser {
  return {
    parse(markdown: string): ParseResult {
      return parse(markdown)
    },

    parseTable(markdown: string, options?: ParseTableOptions) {
      return parseTable(markdown, {
        ...defaults?.tableOptions,
        ...options,
        inference: mergeInference(defaults?.tableOptions?.inference, options?.inference),
      })
    },

    parseList(markdown: string, options?: ParseListOptions) {
      return parseList(markdown, {
        ...defaults?.listOptions,
        ...options,
        inference: mergeInference(defaults?.listOptions?.inference, options?.inference),
      })
    },

    parseKeyValue(markdown: string, options?: ParseKeyValueOptions) {
      return parseKeyValue(markdown, {
        ...defaults?.keyValueOptions,
        ...options,
        inference: mergeInference(defaults?.keyValueOptions?.inference, options?.inference),
      })
    },

    parseSections(markdown: string, options?: ParseSectionOptions) {
      return parseSections(markdown, { ...defaults?.sectionOptions, ...options })
    },
  }
}
