export type HeaderNormalization = 'preserve' | 'camelCase' | 'snake_case' | 'kebab-case' | 'lowercase'

export interface InferenceOptions {
  enabled?: boolean   // default true
  numbers?: boolean   // default true — "42" → 42
  booleans?: boolean  // default true — "true"/"yes"/"1" → true
  nulls?: boolean     // default true — "" / "null" / "n/a" → null
}

export interface ParseTableOptions {
  tableIndex?: number                          // which table to parse (default 0)
  headerNormalization?: HeaderNormalization    // default 'camelCase'
  inference?: InferenceOptions
}

export interface ParseListOptions {
  inference?: InferenceOptions
}

export interface ParseKeyValueOptions {
  delimiters?: string[]   // default [':', '=']
  inference?: InferenceOptions
  headerNormalization?: HeaderNormalization
}

export interface ParseSectionOptions {
  minLevel?: number   // minimum heading level (default 1)
  maxLevel?: number   // maximum heading level (default 6)
}

export interface CheckboxItem {
  text: string
  checked: boolean
}

export interface ParseResult {
  tables: Record<string, unknown>[][]
  lists: Array<string[] | CheckboxItem[]>
  keyValues: Record<string, unknown>[]
  sections: Record<string, string>
  raw: string
}

export interface Parser {
  parse(markdown: string): ParseResult
  parseTable(markdown: string, options?: ParseTableOptions): Record<string, unknown>[]
  parseList(markdown: string, options?: ParseListOptions): Array<string | CheckboxItem>
  parseKeyValue(markdown: string, options?: ParseKeyValueOptions): Record<string, unknown>
  parseSections(markdown: string, options?: ParseSectionOptions): Record<string, string>
}
