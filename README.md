# md-to-data

Parse LLM markdown responses into typed JSON objects.

[![npm version](https://img.shields.io/npm/v/md-to-data.svg)](https://www.npmjs.com/package/md-to-data)
[![npm downloads](https://img.shields.io/npm/dt/md-to-data.svg)](https://www.npmjs.com/package/md-to-data)
[![license](https://img.shields.io/npm/l/md-to-data.svg)](https://github.com/SiluPanda/md-to-data/blob/master/LICENSE)
[![node](https://img.shields.io/node/v/md-to-data.svg)](https://nodejs.org)

---

## Description

`md-to-data` is a deterministic extraction library that converts markdown-formatted LLM responses -- tables, bullet lists, key-value pairs, checkbox lists, and sectioned content -- into typed JavaScript objects. It operates on plain markdown strings and requires no API keys, no schema definitions, and no external network calls. The same input always produces the same output.

LLMs frequently return structured data as markdown rather than JSON. Ask a model to compare products and it returns a markdown table. Ask for a summary of findings and it returns a bullet list with bold keys. Ask for configuration options and it returns colon-delimited key-value pairs. In every case, the developer needs the data as a JavaScript object or array, not as a formatted string.

`md-to-data` handles the entire extraction pipeline: identify markdown structures, parse them into data, apply configurable type inference, and return clean JavaScript values. It tolerates the formatting imperfections that LLMs produce -- misaligned columns, inconsistent pipe placement, bold keys with varying colon placement, and mixed list markers. It works with output from any LLM provider (OpenAI, Anthropic, Google, Mistral, local models) because it operates on the final markdown string, not on provider-specific response structures.

Zero runtime dependencies. All parsing is implemented with hand-written scanners and regex patterns.

---

## Installation

```bash
npm install md-to-data
```

Requires Node.js >= 18.

---

## Quick Start

```typescript
import { parseTable, parseList, parseKeyValue, parseSections, parse } from 'md-to-data';

// Parse a markdown table into typed row objects
const rows = parseTable(`
| Name  | Age | Active |
|-------|-----|--------|
| Alice | 30  | true   |
| Bob   | 25  | false  |
`);
// [{ name: 'Alice', age: 30, active: true }, { name: 'Bob', age: 25, active: false }]

// Parse a bullet list
const items = parseList('- Apple\n- Banana\n- Cherry');
// ['Apple', 'Banana', 'Cherry']

// Parse checkbox items
const tasks = parseList('- [x] Deploy\n- [ ] Write docs');
// [{ text: 'Deploy', checked: true }, { text: 'Write docs', checked: false }]

// Parse key-value pairs
const config = parseKeyValue('host: localhost\nport: 5432');
// { host: 'localhost', port: 5432 }

// Parse sections by heading
const sections = parseSections('# Intro\nHello world.\n\n# Conclusion\nDone.');
// { Intro: 'Hello world.', Conclusion: 'Done.' }

// Parse everything at once
const result = parse(markdownFromLLM);
// { tables: [...], lists: [...], keyValues: [...], sections: {...}, raw: '...' }
```

---

## Features

- **Table extraction** -- Pipe-delimited markdown tables become `Record<string, unknown>[]` arrays with normalized header keys. Supports multiple tables in a single document via `tableIndex`.
- **List extraction** -- Unordered (`-`, `*`, `+`), ordered (`1.`, `2.`), and checkbox (`- [x]`, `- [ ]`) lists are parsed into typed arrays.
- **Key-value extraction** -- Colon-delimited (`key: value`), equals-delimited (`key = value`), bold-key (`**key**: value`), and definition-list patterns are parsed into plain objects.
- **Section extraction** -- Markdown headings (`#` through `######`) split content into a `Record<string, string>` keyed by heading text.
- **Aggregate parsing** -- A single `parse()` call auto-detects and extracts all structural elements from a markdown document.
- **Configurable type inference** -- String values are automatically converted to numbers, booleans, or null. Inference is individually togglable per type.
- **Header normalization** -- Column headers and key-value keys are normalized to `camelCase`, `snake_case`, `kebab-case`, `lowercase`, or `preserve` (as-is).
- **Markdown stripping** -- Bold, italic, inline code, and link formatting is automatically removed from extracted values.
- **Factory parser** -- `createParser()` produces a reusable parser instance with bound default options.
- **Zero dependencies** -- No runtime dependencies. Pure TypeScript, deterministic output.

---

## API Reference

### `parse(markdown: string): ParseResult`

Aggregate parser. Scans the markdown for all recognizable structures and extracts them in a single pass.

```typescript
import { parse } from 'md-to-data';

const result = parse(markdownString);
```

**Returns** a `ParseResult`:

```typescript
interface ParseResult {
  tables: Record<string, unknown>[][];  // one array of row objects per table
  lists: Array<string[] | CheckboxItem[]>;  // one array per list block
  keyValues: Record<string, unknown>[];  // extracted key-value objects
  sections: Record<string, string>;  // heading text -> body content
  raw: string;  // the original markdown input
}
```

Tables are extracted in document order. Lists are split on blank lines or non-list content, producing one entry per list block. Key-value pairs are aggregated into a single object. Sections are keyed by heading text with body content as the value.

---

### `parseTable(markdown: string, options?: ParseTableOptions): Record<string, unknown>[]`

Extracts a single markdown table and returns an array of row objects. Each object is keyed by normalized column headers.

```typescript
import { parseTable } from 'md-to-data';

const md = `
| Product | Price | In Stock |
|---------|-------|----------|
| Widget  | 9.99  | true     |
| Gadget  | 19.99 | false    |
`;

const rows = parseTable(md);
// [{ product: 'Widget', price: 9.99, inStock: true },
//  { product: 'Gadget', price: 19.99, inStock: false }]
```

**Options:**

```typescript
interface ParseTableOptions {
  tableIndex?: number;              // which table to parse when multiple exist (default: 0)
  headerNormalization?: HeaderNormalization;  // how to normalize column headers (default: 'camelCase')
  inference?: InferenceOptions;     // type inference configuration
}
```

**Multi-table support:** When a markdown document contains multiple tables, use `tableIndex` to select the Nth table (zero-indexed). If the index is out of range, an empty array is returned.

```typescript
// Parse the second table in a document
const secondTable = parseTable(md, { tableIndex: 1 });
```

Returns an empty array when no table is found or the specified index does not exist.

---

### `parseList(markdown: string, options?: ParseListOptions): Array<string | CheckboxItem>`

Extracts list items from markdown. Supports unordered lists (`-`, `*`, `+`), ordered lists (`1.`, `2.`), and checkbox lists (`- [x]`, `- [ ]`).

```typescript
import { parseList } from 'md-to-data';

// Unordered list
parseList('- Alpha\n- Beta\n- Gamma');
// ['Alpha', 'Beta', 'Gamma']

// Ordered list
parseList('1. First\n2. Second\n3. Third');
// ['First', 'Second', 'Third']

// Checkbox list
parseList('- [x] Done\n- [ ] Pending');
// [{ text: 'Done', checked: true }, { text: 'Pending', checked: false }]

// Mixed bullet styles
parseList('* Star\n+ Plus\n- Dash');
// ['Star', 'Plus', 'Dash']
```

**Options:**

```typescript
interface ParseListOptions {
  inference?: InferenceOptions;  // type inference configuration
}
```

Checkbox items are returned as `CheckboxItem` objects:

```typescript
interface CheckboxItem {
  text: string;
  checked: boolean;
}
```

Both `[x]` and `[X]` are recognized as checked. Markdown formatting (bold, italic, inline code, links) is stripped from item text.

Returns an empty array when no list items are found.

---

### `parseKeyValue(markdown: string, options?: ParseKeyValueOptions): Record<string, unknown>`

Extracts key-value pairs from markdown lines and returns a plain object.

```typescript
import { parseKeyValue } from 'md-to-data';

const md = `
name: Alice
age: 30
active: true
optional:
missing: null
`;

parseKeyValue(md);
// { name: 'Alice', age: 30, active: true, optional: null, missing: null }
```

**Supported patterns:**

| Pattern | Example |
|---------|---------|
| Colon-delimited | `key: value` |
| Equals-delimited | `key = value` |
| Bold key with colon | `**key**: value` |
| Definition list | `**key**` on one line, `: value` on the next |
| Custom delimiter | Any string via `options.delimiters` |

**Options:**

```typescript
interface ParseKeyValueOptions {
  delimiters?: string[];              // delimiter characters (default: [':', '='])
  inference?: InferenceOptions;       // type inference configuration
  headerNormalization?: HeaderNormalization;  // how to normalize keys (default: 'camelCase')
}
```

Heading lines (`#`, `##`, etc.) and table rows (lines starting with `|`) are automatically skipped.

```typescript
// Custom delimiter
parseKeyValue('key -> value', { delimiters: ['->'] });
// { key: 'value' }

// snake_case keys
parseKeyValue('first name: John', { headerNormalization: 'snake_case' });
// { first_name: 'John' }
```

Returns an empty object when no key-value pairs are found.

---

### `parseSections(markdown: string, options?: ParseSectionOptions): Record<string, string>`

Splits markdown on heading lines and returns an object mapping heading text to body content.

```typescript
import { parseSections } from 'md-to-data';

const md = `
# Introduction
This is the intro.

## Setup
Install dependencies.

### Usage
Run the command.
`;

parseSections(md);
// {
//   Introduction: 'This is the intro.',
//   Setup: 'Install dependencies.',
//   Usage: 'Run the command.'
// }
```

**Options:**

```typescript
interface ParseSectionOptions {
  minLevel?: number;  // minimum heading level to recognize (default: 1)
  maxLevel?: number;  // maximum heading level to recognize (default: 6)
}
```

```typescript
// Only h2 and h3 headings
parseSections(md, { minLevel: 2, maxLevel: 3 });
```

Content between headings is trimmed of leading and trailing whitespace. Markdown formatting is stripped from heading text (e.g., `## **Bold Heading**` becomes the key `Bold Heading`).

Returns an empty object when no headings are found.

---

### `createParser(defaults?: ParserDefaults): Parser`

Factory function that returns a `Parser` instance with bound default options. Per-call options are merged on top of the defaults (per-call options take precedence).

```typescript
import { createParser } from 'md-to-data';

const parser = createParser({
  tableOptions: { headerNormalization: 'snake_case' },
  listOptions: { inference: { enabled: false } },
  keyValueOptions: { headerNormalization: 'snake_case', delimiters: [':'] },
  sectionOptions: { minLevel: 2 },
});

parser.parseTable(md);       // uses snake_case headers by default
parser.parseList(md);        // inference disabled by default
parser.parseKeyValue(md);    // snake_case keys, colon-only delimiter
parser.parseSections(md);    // h2+ sections only
parser.parse(md);            // aggregate parse
```

**`ParserDefaults` fields:**

```typescript
interface ParserDefaults {
  tableOptions?: ParseTableOptions;
  listOptions?: ParseListOptions;
  keyValueOptions?: ParseKeyValueOptions;
  sectionOptions?: ParseSectionOptions;
}
```

**`Parser` interface:**

```typescript
interface Parser {
  parse(markdown: string): ParseResult;
  parseTable(markdown: string, options?: ParseTableOptions): Record<string, unknown>[];
  parseList(markdown: string, options?: ParseListOptions): Array<string | CheckboxItem>;
  parseKeyValue(markdown: string, options?: ParseKeyValueOptions): Record<string, unknown>;
  parseSections(markdown: string, options?: ParseSectionOptions): Record<string, string>;
}
```

---

## Configuration

### Header Normalization

Controls how column headers (in tables) and keys (in key-value pairs) are transformed. The default is `camelCase`.

```typescript
type HeaderNormalization = 'preserve' | 'camelCase' | 'snake_case' | 'kebab-case' | 'lowercase';
```

| Mode | Input | Output |
|------|-------|--------|
| `preserve` | `First Name` | `First Name` |
| `camelCase` | `First Name` | `firstName` |
| `snake_case` | `First Name` | `first_name` |
| `kebab-case` | `First Name` | `first-name` |
| `lowercase` | `First Name` | `first name` |

Words are split on whitespace, hyphens, and underscores before being rejoined in the target style.

### Type Inference

Type inference converts extracted string values into their native JavaScript types. It is enabled by default and can be configured per extraction call.

```typescript
interface InferenceOptions {
  enabled?: boolean;   // master switch (default: true)
  numbers?: boolean;   // "42" -> 42, "3.14" -> 3.14 (default: true)
  booleans?: boolean;  // "true"/"yes" -> true, "false"/"no" -> false (default: true)
  nulls?: boolean;     // "" / "null" / "n/a" / "-" / "none" / "nil" -> null (default: true)
}
```

**Inference rules in priority order:**

| Raw string | Inferred type | Inferred value |
|------------|---------------|----------------|
| `""` (empty) | null | `null` |
| `"null"`, `"n/a"`, `"-"`, `"none"`, `"nil"` | null | `null` |
| `"true"`, `"yes"` | boolean | `true` |
| `"false"`, `"no"` | boolean | `false` |
| `"42"`, `"3.14"`, `"-7"` | number | `42`, `3.14`, `-7` |
| Any other string | string | as-is (trimmed) |

Null detection is case-insensitive. Boolean detection is case-insensitive.

**Disable all inference:**

```typescript
parseTable(md, { inference: { enabled: false } });
// All values remain as strings
```

**Disable specific types:**

```typescript
parseTable(md, { inference: { numbers: false } });
// "42" stays as the string "42", but booleans and nulls are still inferred
```

### Markdown Stripping

All extracted values have markdown formatting automatically removed:

| Markdown | Stripped output |
|----------|---------------|
| `**bold**`, `__bold__` | `bold` |
| `*italic*`, `_italic_` | `italic` |
| `` `code` `` | `code` |
| `[text](url)` | `text` |
| `***bold italic***` | `bold italic` |

This applies to table cells, list items, key-value values, and heading text.

---

## Error Handling

`md-to-data` follows a lenient parsing philosophy. It never throws on valid or malformed input. Instead, it returns empty results when no matching structures are found:

- `parseTable()` returns `[]` when no table is found or the `tableIndex` is out of range.
- `parseList()` returns `[]` when no list items are found.
- `parseKeyValue()` returns `{}` when no key-value pairs are found.
- `parseSections()` returns `{}` when no headings are found.
- `parse()` returns a `ParseResult` with empty arrays/objects for any structure type not present in the input.

Lines that do not match any recognized pattern are silently skipped. Table rows, heading lines, and blank lines are automatically excluded from key-value parsing to avoid false positives.

---

## Advanced Usage

### Parsing Multiple Tables

When an LLM response contains multiple tables, extract each one by index:

```typescript
const md = `
Here are the results:

| City   | Country |
|--------|---------|
| London | UK      |
| Paris  | France  |

And the pricing:

| Product | Price |
|---------|-------|
| Widget  | 9.99  |
| Gadget  | 19.99 |
`;

const cities = parseTable(md, { tableIndex: 0 });
// [{ city: 'London', country: 'UK' }, { city: 'Paris', country: 'France' }]

const products = parseTable(md, { tableIndex: 1 });
// [{ product: 'Widget', price: 9.99 }, { product: 'Gadget', price: 19.99 }]
```

### Filtering Sections by Heading Level

Extract only specific heading levels from deeply nested documents:

```typescript
const md = `
# Overview
High-level summary.

## Details
Implementation notes.

### Sub-detail
Low-level info.
`;

// Only h2 headings
parseSections(md, { minLevel: 2, maxLevel: 2 });
// { Details: 'Implementation notes.\n\n### Sub-detail\nLow-level info.' }
```

### Custom Key-Value Delimiters

Parse non-standard delimiter patterns from LLM output:

```typescript
const md = `
host -> localhost
port -> 5432
`;

parseKeyValue(md, { delimiters: ['->'] });
// { host: 'localhost', port: 5432 }
```

### Definition List Parsing

`parseKeyValue` recognizes definition-list style output where a bold key appears on one line and the colon-prefixed value on the next:

```typescript
const md = `
**Name**
: Alice

**Role**
: Engineer
`;

parseKeyValue(md);
// { name: 'Alice', role: 'Engineer' }
```

### Reusable Parser with Defaults

When processing many LLM responses with the same options, create a parser instance once:

```typescript
import { createParser } from 'md-to-data';

const parser = createParser({
  tableOptions: {
    headerNormalization: 'snake_case',
    inference: { booleans: false },
  },
  keyValueOptions: {
    headerNormalization: 'snake_case',
  },
});

// All calls use snake_case headers and skip boolean inference for tables
for (const response of llmResponses) {
  const rows = parser.parseTable(response);
  // ...
}
```

### Combining with LLM Output Normalization

`md-to-data` pairs well with `llm-output-normalizer`. Use the normalizer to strip preambles and postambles, then parse the cleaned markdown:

```typescript
import { normalize } from 'llm-output-normalizer';
import { parse } from 'md-to-data';

const cleaned = normalize(rawLLMResponse);
const data = parse(cleaned);
```

---

## TypeScript

`md-to-data` is written in TypeScript and ships type declarations alongside the compiled JavaScript. All public types are exported from the package entry point.

```typescript
import type {
  HeaderNormalization,
  InferenceOptions,
  ParseTableOptions,
  ParseListOptions,
  ParseKeyValueOptions,
  ParseSectionOptions,
  CheckboxItem,
  ParseResult,
  Parser,
} from 'md-to-data';
```

### Exported Types

| Type | Description |
|------|-------------|
| `HeaderNormalization` | Union of `'preserve'`, `'camelCase'`, `'snake_case'`, `'kebab-case'`, `'lowercase'` |
| `InferenceOptions` | Configuration for type inference (numbers, booleans, nulls) |
| `ParseTableOptions` | Options for `parseTable`: `tableIndex`, `headerNormalization`, `inference` |
| `ParseListOptions` | Options for `parseList`: `inference` |
| `ParseKeyValueOptions` | Options for `parseKeyValue`: `delimiters`, `inference`, `headerNormalization` |
| `ParseSectionOptions` | Options for `parseSections`: `minLevel`, `maxLevel` |
| `CheckboxItem` | `{ text: string; checked: boolean }` -- a parsed checkbox list item |
| `ParseResult` | Return type of `parse()`: `tables`, `lists`, `keyValues`, `sections`, `raw` |
| `Parser` | Interface for the object returned by `createParser()` |

---

## License

MIT
