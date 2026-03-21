# md-to-data

Parse LLM markdown responses into typed JSON objects.

## Install

```bash
npm install md-to-data
```

## Quick Start

```typescript
import { parseTable, parseList, parseKeyValue, parseSections, parse } from 'md-to-data'

// Parse a markdown table
const md = `
| Name | Age | Active |
|------|-----|--------|
| Alice | 30 | true |
| Bob | 25 | false |
`
const rows = parseTable(md)
// [{ name: 'Alice', age: 30, active: true }, { name: 'Bob', age: 25, active: false }]

// Parse a list
const list = parseList('- Apple\n- Banana\n- Cherry')
// ['Apple', 'Banana', 'Cherry']

// Parse checkboxes
const tasks = parseList('- [x] Done\n- [ ] Pending')
// [{ text: 'Done', checked: true }, { text: 'Pending', checked: false }]
```

## API

### `parseTable(markdown, options?)`

Extracts a markdown table and returns an array of row objects.

```typescript
parseTable(md, {
  tableIndex: 0,               // which table to parse (default 0)
  headerNormalization: 'camelCase', // 'preserve' | 'camelCase' | 'snake_case' | 'kebab-case' | 'lowercase'
  inference: {
    enabled: true,   // master switch
    numbers: true,   // "42" → 42
    booleans: true,  // "true"/"yes" → true
    nulls: true,     // "" / "null" / "n/a" → null
  }
})
```

**Multi-table support:** use `tableIndex` to select the Nth table (0-indexed).

### `parseList(markdown, options?)`

Extracts list items from markdown (unordered, ordered, or checkbox).

```typescript
// Unordered / ordered → string[]
parseList('- Item 1\n- Item 2')
// ['Item 1', 'Item 2']

// Checkbox → CheckboxItem[]
parseList('- [x] Done\n- [ ] Todo')
// [{ text: 'Done', checked: true }, { text: 'Todo', checked: false }]
```

### `parseKeyValue(markdown, options?)`

Extracts key-value pairs from markdown lines.

```typescript
parseKeyValue(`
name: Alice
score: 99
active: true
`, { headerNormalization: 'camelCase' })
// { name: 'Alice', score: 99, active: true }
```

Supports:
- `key: value` (colon delimiter)
- `key = value` (equals delimiter)
- `**key**: value` (bold keys)
- Custom delimiters via `options.delimiters`

### `parseSections(markdown, options?)`

Splits markdown on headings and returns `{ "Heading Text": "content..." }`.

```typescript
parseSections(`
# Introduction
This is the intro.

## Setup
Install dependencies.
`, { minLevel: 1, maxLevel: 2 })
// { Introduction: 'This is the intro.', Setup: 'Install dependencies.' }
```

### `parse(markdown)`

Aggregate parser — runs all sub-parsers and returns a `ParseResult`:

```typescript
interface ParseResult {
  tables: Record<string, unknown>[][]
  lists: Array<string[] | CheckboxItem[]>
  keyValues: Record<string, unknown>[]
  sections: Record<string, string>
  raw: string
}
```

### `createParser(defaults?)`

Factory that returns a `Parser` instance with bound default options:

```typescript
import { createParser } from 'md-to-data'

const parser = createParser({
  tableOptions: { headerNormalization: 'snake_case' },
  keyValueOptions: { headerNormalization: 'snake_case' },
})

parser.parseTable(md)   // uses snake_case by default
parser.parseList(md)
parser.parseKeyValue(md)
parser.parseSections(md)
parser.parse(md)
```

## Type Inference

Type inference is enabled by default. It converts:

| Raw string | Inferred value |
|-----------|----------------|
| `"42"` / `"3.14"` | number |
| `"true"` / `"yes"` | `true` |
| `"false"` / `"no"` | `false` |
| `""` / `"null"` / `"n/a"` / `"-"` | `null` |

Disable globally: `{ inference: { enabled: false } }`
Disable per-type: `{ inference: { numbers: false } }`

## License

MIT
