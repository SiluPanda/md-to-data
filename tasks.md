# md-to-data — Task Breakdown

All tasks derived from SPEC.md. Organized by implementation phase.

---

## Phase 1: Project Setup and Scaffolding

- [ ] **Install dev dependencies** — Add `typescript`, `vitest`, `eslint`, `@types/node` as devDependencies. Add `zod` as an optional peerDependency in package.json. | Status: not_done
- [ ] **Configure ESLint** — Add `.eslintrc` or `eslint.config.js` with TypeScript support. Ensure `npm run lint` works against `src/`. | Status: not_done
- [ ] **Configure Vitest** — Add `vitest.config.ts` if needed (or rely on package.json config). Verify `npm run test` runs and reports zero tests. | Status: not_done
- [ ] **Create directory structure** — Create all directories specified in the file structure: `src/detection/`, `src/extraction/`, `src/inference/`, `src/normalization/`, `src/schema/`, `src/utils/`, `src/__tests__/`, `src/__tests__/fixtures/`. | Status: not_done
- [ ] **Add CLI bin entry to package.json** — Add `"bin": { "md-to-data": "dist/cli.js" }` to package.json so the CLI is available after global install or via npx. | Status: not_done
- [ ] **Verify build pipeline** — Run `npm run build` and confirm TypeScript compiles cleanly with the existing tsconfig.json. Fix any issues. | Status: not_done

---

## Phase 2: TypeScript Type Definitions

- [ ] **Define HeaderNormalization type** — `'preserve' | 'camelCase' | 'snake_case' | 'kebab-case' | 'lowercase'` in `src/types.ts`. | Status: not_done
- [ ] **Define PercentageMode type** — `'decimal' | 'number' | 'string'` in `src/types.ts`. | Status: not_done
- [ ] **Define DateMode type** — `'date' | 'iso' | 'timestamp'` in `src/types.ts`. | Status: not_done
- [ ] **Define CustomInferenceRule interface** — `{ name: string; test: (value: string) => boolean; transform: (value: string) => unknown }` in `src/types.ts`. | Status: not_done
- [ ] **Define InferenceOptions interface** — All inference config fields: `enabled`, `nulls`, `booleans`, `numbers`, `dates`, `dateMode`, `arrays`, `currency`, `percentageMode`, `custom`. Include defaults in JSDoc. | Status: not_done
- [ ] **Define ParseOptions interface** — Shared options: `inference`, `headerNormalization`, `stripMarkdown`, `minConfidence`. | Status: not_done
- [ ] **Define ParseTableOptions interface** — Extends ParseOptions with `tableIndex`, `headerless`, `schema`, `schemaMode`. | Status: not_done
- [ ] **Define ParseListOptions interface** — Extends ParseOptions with `listType: 'simple' | 'keyValue' | 'checkbox' | 'nested'`. | Status: not_done
- [ ] **Define ParseSectionOptions interface** — Extends ParseOptions with `minLevel`, `maxLevel`. | Status: not_done
- [ ] **Define ParseResult interface** — `{ tables, lists, keyValues, sections, meta }`. | Status: not_done
- [ ] **Define ListResult interface** — `{ type, data, confidence }`. | Status: not_done
- [ ] **Define CheckboxItem interface** — `{ text: string; checked: boolean }`. | Status: not_done
- [ ] **Define NestedItem interface** — `{ label: string; children: (string | NestedItem)[] }`. | Status: not_done
- [ ] **Define ParseMeta interface** — `{ tableCount, listCount, keyValueCount, sectionCount, lowConfidence, durationMs, tables }`. | Status: not_done
- [ ] **Define TableMeta interface** — `{ index, rawHeaders, normalizedHeaders, rowCount, alignments, hasSeparator, confidence, startLine, endLine }`. | Status: not_done
- [ ] **Define Parser interface** — The factory-produced parser with `parse`, `parseTable`, `parseList`, `parseKeyValue`, `parseSections` methods. | Status: not_done

---

## Phase 3: Utility Modules

### 3a. Line Utilities (`src/utils/lines.ts`)

- [ ] **Implement line splitting** — Split input string into lines, handling `\n`, `\r\n`, and `\r`. | Status: not_done
- [ ] **Implement line classification** — Classify each line as: table-row, list-item, checkbox-item, key-value, header, separator, code-fence, blank, or prose. | Status: not_done
- [ ] **Implement indentation detection** — Detect indent level for nested lists (2 spaces, 4 spaces, or 1 tab per level). | Status: not_done
- [ ] **Implement code fence tracking** — Track whether the current line is inside a code fence (triple backticks or triple tildes) to exclude code blocks from parsing. | Status: not_done

### 3b. Shared Patterns (`src/utils/patterns.ts`)

- [ ] **Define table row regex** — Pattern to detect lines containing unescaped pipe characters. | Status: not_done
- [ ] **Define separator row regex** — Pattern matching `|---|---|` with optional colons for alignment: `/^[\s|:\-]+$/`. | Status: not_done
- [ ] **Define unordered list item regex** — `/^(\s*)[*+-]\s+(.+)$/`. | Status: not_done
- [ ] **Define ordered list item regex** — `/^(\s*)\d+[.)]\s+(.+)$/`. | Status: not_done
- [ ] **Define checkbox item regex** — `/^(\s*)[*+-]\s+\[([ xX])\]\s+(.+)$/`. | Status: not_done
- [ ] **Define bold-key colon regex** — `/^\*\*(.+?)\*\*:\s*(.+)$/` for `**Key**: Value`. | Status: not_done
- [ ] **Define bold-key colon-inside regex** — `/^\*\*(.+?):\*\*\s*(.+)$/` for `**Key:** Value`. | Status: not_done
- [ ] **Define plain colon key-value regex** — `/^([^:]{1,50}):\s+(.+)$/`. | Status: not_done
- [ ] **Define definition list regex** — Pattern matching `term\n: definition`. | Status: not_done
- [ ] **Define header regex** — `/^(#{1,6})\s+(.+)$/` for markdown headers. | Status: not_done
- [ ] **Define URL exclusion pattern** — `/^https?:/`, `ftp:/`, `mailto:` to exclude colons in URLs from key-value detection. | Status: not_done
- [ ] **Define horizontal rule regex** — Pattern for `---`, `***`, `___` lines to exclude from table detection. | Status: not_done

---

## Phase 4: Normalization Modules

### 4a. Header Normalization (`src/normalization/headers.ts`)

- [ ] **Implement `preserve` mode** — Return header text as-is (after markdown stripping). | Status: not_done
- [ ] **Implement `camelCase` mode** — Convert "First Name" to "firstName", handle multi-word headers. | Status: not_done
- [ ] **Implement `snake_case` mode** — Convert "First Name" to "first_name". | Status: not_done
- [ ] **Implement `kebab-case` mode** — Convert "First Name" to "first-name". | Status: not_done
- [ ] **Implement `lowercase` mode** — Convert "First Name" to "first name". | Status: not_done
- [ ] **Strip markdown from headers before normalizing** — Remove `**bold**`, `` `code` ``, `[Link](url)`, `*italic*` formatting from header text. | Status: not_done

### 4b. Markdown Stripping (`src/normalization/markdown-strip.ts`)

- [ ] **Strip bold formatting** — `**text**` and `__text__` become `text`. | Status: not_done
- [ ] **Strip italic formatting** — `*text*` and `_text_` become `text`. | Status: not_done
- [ ] **Strip inline code** — `` `code` `` becomes `code`. | Status: not_done
- [ ] **Strip links** — `[text](url)` becomes `text`. | Status: not_done
- [ ] **Strip images** — `![alt](url)` becomes `alt`. | Status: not_done
- [ ] **Replace `<br>` and `<br/>` with newline** — HTML line breaks in cells become `\n`. | Status: not_done
- [ ] **Support configurable stripping** — When `stripMarkdown: false`, preserve formatting. | Status: not_done

---

## Phase 5: Type Inference Pipeline

### 5a. Inference Orchestrator (`src/inference/index.ts`)

- [ ] **Implement inference pipeline** — Accept a string value and InferenceOptions, apply rules in priority order, return inferred value. | Status: not_done
- [ ] **Support disabling all inference** — When `inference: false` or `inference.enabled: false`, return string as-is. | Status: not_done
- [ ] **Support custom inference rules** — Check custom rules (from `inference.custom`) before built-in rules. First match wins. | Status: not_done
- [ ] **Support per-type enable/disable** — Each built-in rule (nulls, booleans, numbers, dates, arrays) can be individually toggled. | Status: not_done

### 5b. Null Detection (`src/inference/null.ts`)

- [ ] **Detect null strings** — Map `""`, `"N/A"`, `"n/a"`, `"NA"`, `"None"`, `"none"`, `"null"`, `"NULL"`, `"-"`, `"--"`, `"---"`, em dash (`"\u2014"`), `"undefined"` to `null`. Case-insensitive where applicable. | Status: not_done
- [ ] **Respect `inference.nulls` toggle** — Only apply when `nulls` is true (default). | Status: not_done

### 5c. Boolean Detection (`src/inference/boolean.ts`)

- [ ] **Detect truthy strings** — `"true"`, `"True"`, `"TRUE"`, `"yes"`, `"Yes"`, `"on"`, `"enabled"` map to `true`. Case-insensitive. | Status: not_done
- [ ] **Detect falsy strings** — `"false"`, `"False"`, `"FALSE"`, `"no"`, `"No"`, `"off"`, `"disabled"` map to `false`. Case-insensitive. | Status: not_done
- [ ] **Context-sensitive detection** — Only infer boolean when the trimmed string is exactly a boolean keyword (standalone), not part of a longer string. | Status: not_done
- [ ] **Respect `inference.booleans` toggle** — Only apply when `booleans` is true (default). | Status: not_done

### 5d. Number Detection (`src/inference/number.ts`)

- [ ] **Detect integers** — `"42"`, `"-7"`, `"0"` become numbers. | Status: not_done
- [ ] **Detect floats** — `"3.14"`, `"-0.5"` become numbers. | Status: not_done
- [ ] **Detect comma-separated numbers** — `"1,000"`, `"1,234.56"` become numbers (commas stripped). | Status: not_done
- [ ] **Detect scientific notation** — `"1.5e10"`, `"2E-3"` become numbers. | Status: not_done
- [ ] **Detect percentages** — `"95%"` maps to `0.95` (decimal mode), `95` (number mode), or stays `"95%"` (string mode), based on `percentageMode`. | Status: not_done
- [ ] **Detect currency-prefixed numbers** — `"$100"` becomes `100` when `inference.currency` is true. Strip `$`, `EUR`, `GBP`, etc. | Status: not_done
- [ ] **Exclude phone numbers** — `"555-1234"`, `"+1-800-555-0199"` are not numbers. | Status: not_done
- [ ] **Exclude version numbers** — `"1.2.3"`, `"v2.0"` (multiple dots or leading `v`) are not numbers. | Status: not_done
- [ ] **Exclude ZIP codes with leading zero** — `"02101"` stays as string. But `"0"` and `"0.5"` are valid numbers. | Status: not_done
- [ ] **Respect `inference.numbers` toggle** — Only apply when `numbers` is true (default). | Status: not_done

### 5e. Date Detection (`src/inference/date.ts`)

- [ ] **Detect ISO 8601 date strings** — `"2024-01-15"` detected as date. | Status: not_done
- [ ] **Detect ISO 8601 datetime strings** — `"2024-01-15T10:30:00Z"`, `"2024-01-15T10:30:00+05:30"` detected. | Status: not_done
- [ ] **Support `dateMode: 'date'`** — Return JavaScript `Date` object. | Status: not_done
- [ ] **Support `dateMode: 'iso'`** — Return ISO string as-is (default when dates enabled). | Status: not_done
- [ ] **Support `dateMode: 'timestamp'`** — Return Unix timestamp in milliseconds. | Status: not_done
- [ ] **Opt-in only** — Dates disabled by default (`inference.dates: false`). | Status: not_done

### 5f. Array Detection (`src/inference/array.ts`)

- [ ] **Detect comma-separated values** — `"red, green, blue"` becomes `["red", "green", "blue"]`. | Status: not_done
- [ ] **Apply type inference to each element** — `"1, 2, 3"` becomes `[1, 2, 3]`. | Status: not_done
- [ ] **Heuristic: minimum one comma** — Require at least one comma for array detection. | Status: not_done
- [ ] **Heuristic: short items** — Each item must be under 50 characters. | Status: not_done
- [ ] **Heuristic: exclude prose** — Do not split sentences containing conjunctions after the last comma in a two-item list. | Status: not_done
- [ ] **Opt-in only** — Arrays disabled by default (`inference.arrays: false`). | Status: not_done

---

## Phase 6: Detection Modules

### 6a. Table Detector (`src/detection/table-detector.ts`)

- [ ] **Detect table boundaries** — Scan lines for consecutive pipe-delimited rows. Identify start/end line indices. | Status: not_done
- [ ] **Detect separator row** — Identify rows matching `/^[\s|:\-]+$/`. Separate header from body. | Status: not_done
- [ ] **Handle missing separator row** — When no separator found, treat first row as header with reduced confidence (0.7). | Status: not_done
- [ ] **Handle malformed separator** — If separator row contains non-separator characters, treat as data row, confidence 0.6. | Status: not_done
- [ ] **Validate column count consistency** — All rows should have consistent column count (within tolerance of 1). | Status: not_done
- [ ] **Require minimum 2 rows** — At least header + 1 data row. | Status: not_done
- [ ] **Skip lines inside code fences** — Do not detect tables inside fenced code blocks. | Status: not_done
- [ ] **Detect multiple tables** — Identify all table regions separated by non-table content. | Status: not_done
- [ ] **Detect column alignment** — Parse `:---`, `:---:`, `---:` from separator row. Report as `'left' | 'center' | 'right'`. | Status: not_done

### 6b. List Detector (`src/detection/list-detector.ts`)

- [ ] **Detect unordered list boundaries** — Consecutive lines matching `-`, `*`, `+` markers. | Status: not_done
- [ ] **Detect ordered list boundaries** — Consecutive lines matching `\d+[.)]\s`. | Status: not_done
- [ ] **Detect checkbox lists** — Lines with `- [ ]` or `- [x]`/`- [X]` patterns. If at least one checkbox item, treat entire list as checkbox list. | Status: not_done
- [ ] **Handle mixed list markers** — Treat `-`, `*`, `+` as equivalent unordered markers. | Status: not_done
- [ ] **Handle non-sequential numbering** — `1. 1. 1.` or skipped numbers still form a valid ordered list. | Status: not_done
- [ ] **Handle blank lines within lists** — Blank lines between items do not break the list unless followed by non-list content. | Status: not_done
- [ ] **Detect continuation lines** — Indented lines following a list item belong to that item. | Status: not_done
- [ ] **Detect nested lists** — Indented list items form child lists. | Status: not_done

### 6c. Key-Value Detector (`src/detection/kv-detector.ts`)

- [ ] **Detect bold-key colon pattern** — `**Key**: Value` lines. Confidence 0.95. | Status: not_done
- [ ] **Detect bold-key colon-inside pattern** — `**Key:** Value` lines. Confidence 0.95. | Status: not_done
- [ ] **Detect plain colon pattern** — `Key: Value` lines in consecutive groups. Confidence 0.7. | Status: not_done
- [ ] **Detect definition list pattern** — `Term\n: Definition`. Confidence 0.85. | Status: not_done
- [ ] **Detect key-value in list items** — `- **Key**: Value` or `- Key: Value`. Confidence 0.8-0.9. | Status: not_done
- [ ] **Apply URL exclusion** — Do not treat `http:`, `https:`, `ftp:`, `mailto:` as key-value separators. | Status: not_done
- [ ] **Apply time exclusion** — Colons in time values (`3:45 PM`) are not key-value separators. | Status: not_done
- [ ] **Apply sentence exclusion** — Keys with more than 6 words are likely sentence fragments, not keys. | Status: not_done
- [ ] **Apply minimum group size** — Standalone plain colon lines require at least 2 consecutive matching lines. | Status: not_done
- [ ] **Apply prose context exclusion** — Do not extract key-values when surrounded by prose paragraphs. | Status: not_done

### 6d. Section Detector (`src/detection/section-detector.ts`)

- [ ] **Detect headers** — Lines matching `# ` through `###### `. Extract level (1-6) and text. | Status: not_done
- [ ] **Detect section boundaries** — Content between consecutive headers forms a section body. | Status: not_done
- [ ] **Handle nested headers** — Lower-level headers nested within higher-level sections. | Status: not_done
- [ ] **Respect `minLevel` and `maxLevel`** — Only extract headers within the configured level range. | Status: not_done

### 6e. Detection Orchestrator (`src/detection/index.ts`)

- [ ] **Implement unified detection** — Run all detectors on the classified lines and return all detected structures with their boundaries and types. | Status: not_done

---

## Phase 7: Extraction Modules

### 7a. Table Extractor (`src/extraction/table-extractor.ts`)

- [ ] **Implement row parsing** — Split rows on unescaped pipes. Handle escaped pipes (`\|`). Strip leading/trailing empty cells from outer pipes. Trim cell whitespace. | Status: not_done
- [ ] **Extract headers** — Parse first row (or row above separator) as headers. Apply header normalization. Strip markdown from headers. | Status: not_done
- [ ] **Map data rows to objects** — Use normalized headers as keys. Apply type inference to each cell value. | Status: not_done
- [ ] **Handle missing cells** — Rows with fewer cells than headers get `null` for missing positions. | Status: not_done
- [ ] **Handle extra cells** — Rows with more cells than headers: extra cells are ignored, noted in metadata. | Status: not_done
- [ ] **Handle inconsistent column counts** — Rows differing by more than 2 columns from header count are skipped, noted in metadata. | Status: not_done
- [ ] **Handle headerless tables** — When `headerless: true`, generate keys as `column1`, `column2`, etc. | Status: not_done
- [ ] **Handle tables without headers heuristic** — When no separator and no `headerless` flag, heuristically detect if first row is headers (short, title-cased) vs data. Confidence 0.6. | Status: not_done
- [ ] **Handle markdown in cells** — Strip bold, italic, code, links from cell values by default. Preserve with `stripMarkdown: false`. | Status: not_done
- [ ] **Support `tableIndex` option** — Select specific table by zero-based index. Default: 0. | Status: not_done
- [ ] **Build TableMeta** — Populate metadata: index, rawHeaders, normalizedHeaders, rowCount, alignments, hasSeparator, confidence, startLine, endLine. | Status: not_done

### 7b. List Extractor (`src/extraction/list-extractor.ts`)

- [ ] **Extract simple lists** — List items without key-value patterns become string arrays. Apply type inference to each item. | Status: not_done
- [ ] **Extract key-value lists** — When >=50% items match key-value patterns, extract as object. Normalize keys. Apply type inference to values. | Status: not_done
- [ ] **Handle bold-key colon pattern in list** — `- **Key**: Value`. | Status: not_done
- [ ] **Handle bold-key colon-inside pattern in list** — `- **Key:** Value`. | Status: not_done
- [ ] **Handle plain colon pattern in list** — `- Key: Value`. | Status: not_done
- [ ] **Handle non-matching items in key-value list** — Items that don't match pattern get auto-generated keys or go to `_other` array. | Status: not_done
- [ ] **Extract checkbox lists** — Items with `[x]`/`[X]` get `checked: true`, `[ ]` get `checked: false`. Return `{ text, checked }[]`. | Status: not_done
- [ ] **Handle mixed checkbox/non-checkbox** — Non-checkbox items in a checkbox list treated as unchecked. | Status: not_done
- [ ] **Extract nested lists** — Build tree structure from indentation. Parent items get `{ label, children }`. Leaf items are plain strings. | Status: not_done
- [ ] **Handle multi-line list items** — Concatenate continuation lines (indented beyond list level) to the parent item with space separator. | Status: not_done
- [ ] **Support `listType` option** — Force extraction as specific type instead of auto-detecting. | Status: not_done

### 7c. Key-Value Extractor (`src/extraction/kv-extractor.ts`)

- [ ] **Extract bold-key colon pairs** — Parse `**Key**: Value` lines into object entries. Normalize keys. | Status: not_done
- [ ] **Extract bold-key colon-inside pairs** — Parse `**Key:** Value` lines. | Status: not_done
- [ ] **Extract plain colon pairs** — Parse `Key: Value` lines into object entries. | Status: not_done
- [ ] **Extract definition lists** — Parse `Term\n: Definition` into object entries. | Status: not_done
- [ ] **Extract header-grouped key-values** — Nest key-value pairs under their parent header key. | Status: not_done
- [ ] **Handle multi-line values** — Concatenate indented continuation lines to the value. | Status: not_done
- [ ] **Apply type inference to all values** — Every extracted value passes through the inference pipeline. | Status: not_done
- [ ] **Apply confidence scoring** — Each extraction group gets a confidence score based on its pattern type. | Status: not_done

### 7d. Section Extractor (`src/extraction/section-extractor.ts`)

- [ ] **Extract section tree** — Build nested object from header hierarchy. Header text becomes key. | Status: not_done
- [ ] **Recursively parse section bodies** — If body contains a table, section value is extracted table data. If body contains a list, section value is extracted list. If body contains key-value pairs, section value is extracted object. If body is prose, section value is the text string. | Status: not_done
- [ ] **Handle nested headers** — Lower-level headers create nested keys within parent sections. | Status: not_done
- [ ] **Respect `minLevel` and `maxLevel`** — Only extract headers within configured range. | Status: not_done

---

## Phase 8: Public API Functions

### 8a. `parseTable()` (`src/parseTable.ts`)

- [ ] **Implement parseTable function** — Accept markdown string and optional ParseTableOptions. Detect tables, extract the one at `tableIndex` (default 0), return `Record<string, unknown>[]`. | Status: not_done
- [ ] **Support generic type parameter** — `parseTable<T>(md)` returns `T[]` for compile-time type safety. | Status: not_done
- [ ] **Return empty array when no table found** — Never throw on valid input with no table. | Status: not_done

### 8b. `parseList()` (`src/parseList.ts`)

- [ ] **Implement parseList function** — Accept markdown string and optional ParseListOptions. Auto-detect list type and extract accordingly. | Status: not_done
- [ ] **Return appropriate type based on list content** — Simple list returns `string[]`/`unknown[]`, key-value list returns `Record<string, unknown>`, checkbox list returns `CheckboxItem[]`, nested list returns `NestedItem[]`. | Status: not_done
- [ ] **Return empty array when no list found** — Never throw on valid input. | Status: not_done

### 8c. `parseKeyValue()` (`src/parseKeyValue.ts`)

- [ ] **Implement parseKeyValue function** — Accept markdown string. Detect and extract key-value pairs into `Record<string, unknown>`. | Status: not_done
- [ ] **Return empty object when no key-values found** — Never throw on valid input. | Status: not_done

### 8d. `parseSections()` (`src/parseSections.ts`)

- [ ] **Implement parseSections function** — Accept markdown string and optional ParseSectionOptions. Extract header-delimited sections into nested `Record<string, unknown>`. | Status: not_done
- [ ] **Return empty object when no sections found** — Never throw on valid input. | Status: not_done

### 8e. `parse()` / `parseAll()` (`src/parse.ts`)

- [ ] **Implement parse function** — Auto-detect all structures in markdown and return unified ParseResult with `tables`, `lists`, `keyValues`, `sections`, and `meta`. | Status: not_done
- [ ] **Implement parseAll function** — Alias or full version of parse that returns all structures with metadata. | Status: not_done
- [ ] **Populate ParseMeta** — Include `tableCount`, `listCount`, `keyValueCount`, `sectionCount`, `lowConfidence`, `durationMs`, per-table metadata. | Status: not_done
- [ ] **Apply minConfidence filtering** — Structures below `minConfidence` threshold are excluded from results but included in `meta.lowConfidence`. | Status: not_done
- [ ] **Measure duration** — Record processing time in `meta.durationMs`. | Status: not_done

### 8f. `createParser()` Factory (`src/factory.ts`)

- [ ] **Implement createParser function** — Accept ParseOptions, return a Parser instance with preset options. All methods on the parser use the preset options merged with per-call options. | Status: not_done

### 8g. Public Exports (`src/index.ts`)

- [ ] **Export all public API functions** — `parse`, `parseAll`, `parseTable`, `parseList`, `parseKeyValue`, `parseSections`, `createParser`. | Status: not_done
- [ ] **Export all public types** — All interfaces and type aliases from `types.ts`. | Status: not_done

---

## Phase 9: Schema Validation (Zod Integration)

- [ ] **Implement lazy Zod import** — In `src/schema/index.ts`, dynamically import/require Zod only when a schema option is provided. Throw clear error if Zod is not installed: "Schema validation requires 'zod' to be installed. Run: npm install zod". | Status: not_done
- [ ] **Implement `strict` schema mode** — Validate each extracted record against the Zod schema. Throw `ZodError` on first failure. | Status: not_done
- [ ] **Implement `partial` schema mode** — Validate each record. Return successfully validated rows. Collect errors in `meta.validationErrors`. Omit failing rows from result. | Status: not_done
- [ ] **Implement `coerce` schema mode** — Attempt Zod coercion for type mismatches. Fall back to raw string if coercion fails. | Status: not_done
- [ ] **Schema-guided type override** — When schema is provided, bypass the built-in type inference pipeline in favor of Zod coercion for precision. | Status: not_done
- [ ] **Wire schema into parseTable** — Accept `schema` and `schemaMode` in ParseTableOptions. Apply validation after extraction. | Status: not_done
- [ ] **TypeScript return type narrowing** — When a Zod schema is provided, the return type should be the schema's inferred type (e.g., `User[]` instead of `Record<string, unknown>[]`). | Status: not_done

---

## Phase 10: CLI Implementation

- [ ] **Implement CLI entry point** — `src/cli.ts` with shebang line (`#!/usr/bin/env node`). | Status: not_done
- [ ] **Implement stdin reading** — Read markdown from stdin by default. | Status: not_done
- [ ] **Implement `--file <path>` flag** — Read markdown from a file instead of stdin. | Status: not_done
- [ ] **Implement extraction mode flags** — `--tables`, `--lists`, `--key-values`, `--sections`, `--all` (default). | Status: not_done
- [ ] **Implement table options flags** — `--table-index <n>`, `--headers <mode>`, `--headerless`. | Status: not_done
- [ ] **Implement type inference flags** — `--no-inference`, `--no-nulls`, `--no-booleans`, `--no-numbers`, `--dates`, `--arrays`. | Status: not_done
- [ ] **Implement output flags** — `--compact` for compact JSON, `--format json|csv|tsv`. | Status: not_done
- [ ] **Implement `--version` flag** — Print package version from package.json. | Status: not_done
- [ ] **Implement `--help` flag** — Print usage help text to stdout. | Status: not_done
- [ ] **Implement exit codes** — `0` for success (at least one structure extracted), `1` for no structures found, `2` for config/input errors. | Status: not_done
- [ ] **Implement JSON output** — Pretty-print JSON to stdout by default. Compact with `--compact`. | Status: not_done
- [ ] **Implement CSV output** — Convert table data to CSV format. Only valid with `--tables`. | Status: not_done
- [ ] **Implement TSV output** — Convert table data to TSV format. Only valid with `--tables`. | Status: not_done
- [ ] **Error output to stderr** — All errors and warnings go to stderr, not stdout. | Status: not_done
- [ ] **Flag parsing without external dependencies** — Parse CLI flags using hand-written logic (no commander, yargs, etc.) to maintain zero runtime dependencies. | Status: not_done

---

## Phase 11: Error Handling

- [ ] **Throw TypeError on null/undefined input** — All parse functions throw `TypeError` when called with `null` or `undefined`. | Status: not_done
- [ ] **Return empty results on empty string** — `parse("")` returns `{ tables: [], lists: [], keyValues: [], sections: {} }`. No throw. | Status: not_done
- [ ] **Return empty results on whitespace-only input** — Same behavior as empty string. | Status: not_done
- [ ] **Return empty results on pure prose** — Input with no markdown structures returns empty results. | Status: not_done
- [ ] **Graceful degradation on malformed tables** — Best-effort extraction with reduced confidence. Fill missing cells with null. Skip wildly inconsistent rows. Note in metadata. | Status: not_done
- [ ] **Type inference fallback** — If inference fails or encounters unexpected input, value remains a string. Never throw from inference. | Status: not_done

---

## Phase 12: Test Fixtures

### 12a. Table Fixtures (`src/__tests__/fixtures/tables.ts`)

- [ ] **Standard GFM table fixture** — Table with separator and outer pipes. | Status: not_done
- [ ] **Table without outer pipes fixture** — LLM-style table omitting leading/trailing pipes. | Status: not_done
- [ ] **Table without separator row fixture** — No `|---|---|` row. | Status: not_done
- [ ] **Table with alignment markers fixture** — `:---`, `:---:`, `---:` in separator. | Status: not_done
- [ ] **Table with empty cells fixture** — Some cells are empty. | Status: not_done
- [ ] **Table with nested markdown fixture** — Bold, code, links in cells. | Status: not_done
- [ ] **Table with escaped pipes fixture** — `\|` in cell content. | Status: not_done
- [ ] **Table with misaligned columns fixture** — Varying whitespace. | Status: not_done
- [ ] **Table with numeric data fixture** — Integers, floats, percentages. | Status: not_done
- [ ] **Table with boolean-like values fixture** — "Yes"/"No", "true"/"false". | Status: not_done
- [ ] **Table with null-like values fixture** — "N/A", "-", "None". | Status: not_done
- [ ] **Table with multi-word headers fixture** — "First Name", "Last Modified Date". | Status: not_done
- [ ] **Multiple tables in one document fixture** — Two or more tables separated by prose. | Status: not_done
- [ ] **Table embedded in prose fixture** — Paragraphs before and after a table. | Status: not_done

### 12b. List Fixtures (`src/__tests__/fixtures/lists.ts`)

- [ ] **Simple unordered list (dash) fixture** — `- item`. | Status: not_done
- [ ] **Simple unordered list (asterisk) fixture** — `* item`. | Status: not_done
- [ ] **Simple unordered list (plus) fixture** — `+ item`. | Status: not_done
- [ ] **Mixed markers fixture** — `-`, `*`, `+` in one list. | Status: not_done
- [ ] **Ordered list (period) fixture** — `1. item`. | Status: not_done
- [ ] **Ordered list (parenthesis) fixture** — `1) item`. | Status: not_done
- [ ] **Key-value list with bold keys fixture** — `- **Key**: Value`. | Status: not_done
- [ ] **Key-value list with plain keys fixture** — `- Key: Value`. | Status: not_done
- [ ] **Nested list (two levels) fixture** — Parent with indented children. | Status: not_done
- [ ] **Nested list (three levels) fixture** — Three levels of nesting. | Status: not_done
- [ ] **Checkbox list (all checked) fixture** — All `[x]`. | Status: not_done
- [ ] **Checkbox list (mixed) fixture** — Mix of `[x]` and `[ ]`. | Status: not_done
- [ ] **Multi-line list items fixture** — Items spanning multiple lines. | Status: not_done
- [ ] **List with type-inferable values fixture** — Numbers, booleans in list items. | Status: not_done

### 12c. Key-Value Fixtures (`src/__tests__/fixtures/keyValues.ts`)

- [ ] **Bold-key colon pattern fixture** — `**Key**: Value` lines. | Status: not_done
- [ ] **Bold-key colon-inside pattern fixture** — `**Key:** Value` lines. | Status: not_done
- [ ] **Plain colon pattern fixture** — Consecutive `Key: Value` lines. | Status: not_done
- [ ] **Definition list pattern fixture** — `Term\n: Definition` lines. | Status: not_done
- [ ] **Header-grouped key-values fixture** — Key-value pairs under headers. | Status: not_done
- [ ] **Multi-line values fixture** — Values continuing on indented lines. | Status: not_done
- [ ] **Values containing colons (URLs, times) fixture** — Colon in URLs and time values. | Status: not_done
- [ ] **Key-value pairs in a list fixture** — `- **Key**: Value` in list items. | Status: not_done

### 12d. Section Fixtures (`src/__tests__/fixtures/sections.ts`)

- [ ] **Single-level headers fixture** — All same-level headers with text bodies. | Status: not_done
- [ ] **Multi-level headers fixture** — h1 > h2 > h3 nesting. | Status: not_done
- [ ] **Sections containing tables fixture** — Table as section body content. | Status: not_done
- [ ] **Sections containing lists fixture** — List as section body content. | Status: not_done
- [ ] **Sections containing key-values fixture** — Key-value pairs as section body. | Status: not_done
- [ ] **Mixed content under sections fixture** — Sections with various content types. | Status: not_done

### 12e. Combined/Edge Case Fixtures (`src/__tests__/fixtures/combined.ts`, `edgeCases.ts`)

- [ ] **Empty string input fixture** — `""`. | Status: not_done
- [ ] **Whitespace-only input fixture** — `"   \n\n  "`. | Status: not_done
- [ ] **Pure prose input fixture** — No markdown structures. | Status: not_done
- [ ] **Very large table fixture** — 100+ rows. | Status: not_done
- [ ] **Table with very long cell values fixture** — Cells with sentences. | Status: not_done
- [ ] **Mixed content fixture** — Prose + table + list + key-values in one document. | Status: not_done
- [ ] **LLM preamble/postamble fixture** — Table surrounded by conversational text. | Status: not_done
- [ ] **Table immediately followed by list fixture** — No separator between structures. | Status: not_done

### 12f. Type Inference Fixtures (`src/__tests__/fixtures/`)

- [ ] **Null values fixture** — All null-like strings and expected outputs. | Status: not_done
- [ ] **Boolean values fixture** — All boolean-like strings and expected outputs. | Status: not_done
- [ ] **Number values fixture** — Integers, floats, scientific notation, comma-separated, percentages. | Status: not_done
- [ ] **Non-numeric false positives fixture** — Phone numbers, version numbers, ZIP codes. | Status: not_done
- [ ] **Date values fixture** — ISO 8601 date and datetime strings. | Status: not_done
- [ ] **Array values fixture** — Comma-separated value strings. | Status: not_done
- [ ] **Boolean false positives fixture** — Strings like "Notice", "Yesterday" that contain boolean substrings but are not booleans. | Status: not_done

### 12g. Real LLM Output Fixtures (`src/__tests__/fixtures/llmOutputs.ts`)

- [ ] **GPT-4o style table fixture** — Typical GPT-4o formatted comparison table. | Status: not_done
- [ ] **Claude style response fixture** — Typical Claude formatted response with sections. | Status: not_done
- [ ] **Gemini style list fixture** — Typical Gemini formatted bullet list. | Status: not_done
- [ ] **Local model (Llama/Mistral) quirky table fixture** — Table with formatting inconsistencies typical of local models. | Status: not_done

---

## Phase 13: Unit Tests

### 13a. Table Tests (`src/__tests__/parseTable.test.ts`)

- [ ] **Test standard GFM table extraction** — Correct headers, values, types. | Status: not_done
- [ ] **Test table without outer pipes** — Headers and values still extracted correctly. | Status: not_done
- [ ] **Test table without separator row** — First row treated as headers, confidence 0.7. | Status: not_done
- [ ] **Test table with alignment markers** — Alignment info in metadata, values unaffected. | Status: not_done
- [ ] **Test table with empty cells** — Empty cells become null (with inference) or empty string. | Status: not_done
- [ ] **Test table with nested markdown** — Bold, code, links stripped from cell values by default. | Status: not_done
- [ ] **Test table with escaped pipes** — `\|` preserved as literal `|` in cell content. | Status: not_done
- [ ] **Test table with misaligned columns** — Varying whitespace handled correctly. | Status: not_done
- [ ] **Test numeric type inference in tables** — Numbers correctly inferred. | Status: not_done
- [ ] **Test boolean type inference in tables** — "Yes"/"No" correctly inferred. | Status: not_done
- [ ] **Test null type inference in tables** — "N/A", "-" correctly inferred as null. | Status: not_done
- [ ] **Test multi-word header normalization** — All five normalization modes tested. | Status: not_done
- [ ] **Test multiple tables with tableIndex** — Correct table selected by index. | Status: not_done
- [ ] **Test table embedded in prose** — Preamble/postamble ignored. | Status: not_done
- [ ] **Test headerless table** — Generated column1, column2 keys. | Status: not_done
- [ ] **Test missing cells** — Null for missing positions. | Status: not_done
- [ ] **Test extra cells** — Extra cells ignored. | Status: not_done
- [ ] **Test stripMarkdown: false** — Formatting preserved in cells. | Status: not_done
- [ ] **Test inference: false** — All values remain strings. | Status: not_done
- [ ] **Test returns empty array when no table** — `parseTable("no table here")` returns `[]`. | Status: not_done

### 13b. List Tests (`src/__tests__/parseList.test.ts`)

- [ ] **Test simple unordered list extraction** — All three marker types. | Status: not_done
- [ ] **Test simple ordered list extraction** — Period and parenthesis formats. | Status: not_done
- [ ] **Test key-value list with bold keys** — Returns object with normalized keys. | Status: not_done
- [ ] **Test key-value list with plain keys** — Returns object with normalized keys. | Status: not_done
- [ ] **Test checkbox list extraction** — Correct `{ text, checked }` for each item. | Status: not_done
- [ ] **Test nested list extraction** — Correct tree structure with `{ label, children }`. | Status: not_done
- [ ] **Test multi-line list items** — Continuation lines concatenated. | Status: not_done
- [ ] **Test mixed markers** — `-`, `*`, `+` treated equivalently. | Status: not_done
- [ ] **Test type inference in list values** — Numbers, booleans inferred in list items. | Status: not_done
- [ ] **Test listType option** — Force specific list type. | Status: not_done
- [ ] **Test returns empty array when no list** — `parseList("no list here")` returns `[]`. | Status: not_done

### 13c. Key-Value Tests (`src/__tests__/parseKeyValue.test.ts`)

- [ ] **Test bold-key colon extraction** — Correct object with normalized keys. | Status: not_done
- [ ] **Test bold-key colon-inside extraction** — Correct object. | Status: not_done
- [ ] **Test plain colon extraction** — Consecutive lines become object. | Status: not_done
- [ ] **Test definition list extraction** — `Term\n: Definition` becomes object. | Status: not_done
- [ ] **Test header-grouped key-values** — Nested objects under header keys. | Status: not_done
- [ ] **Test multi-line value extraction** — Indented continuation lines concatenated. | Status: not_done
- [ ] **Test URL exclusion** — Lines with URLs not treated as key-value. | Status: not_done
- [ ] **Test time exclusion** — Time colons not treated as key-value separator. | Status: not_done
- [ ] **Test sentence exclusion** — Long "keys" (>6 words) not treated as keys. | Status: not_done
- [ ] **Test minimum group size** — Single isolated `Key: Value` line not extracted. | Status: not_done
- [ ] **Test type inference on values** — Numbers, booleans, nulls inferred. | Status: not_done
- [ ] **Test returns empty object when no key-values** — `parseKeyValue("no pairs")` returns `{}`. | Status: not_done

### 13d. Section Tests (`src/__tests__/parseSections.test.ts`)

- [ ] **Test single-level section extraction** — Correct keys and text values. | Status: not_done
- [ ] **Test multi-level nested sections** — Correct nested object structure. | Status: not_done
- [ ] **Test section with table body** — Section value is extracted table data. | Status: not_done
- [ ] **Test section with list body** — Section value is extracted list. | Status: not_done
- [ ] **Test section with key-value body** — Section value is extracted object. | Status: not_done
- [ ] **Test section with prose body** — Section value is text string. | Status: not_done
- [ ] **Test minLevel and maxLevel options** — Headers outside range excluded. | Status: not_done
- [ ] **Test returns empty object when no sections** — `parseSections("no headers")` returns `{}`. | Status: not_done

### 13e. Parse/ParseAll Tests (`src/__tests__/parse.test.ts`)

- [ ] **Test auto-detection of tables** — Tables found and returned in `result.tables`. | Status: not_done
- [ ] **Test auto-detection of lists** — Lists found and returned in `result.lists`. | Status: not_done
- [ ] **Test auto-detection of key-values** — Key-values found and returned in `result.keyValues`. | Status: not_done
- [ ] **Test auto-detection of sections** — Sections found and returned in `result.sections`. | Status: not_done
- [ ] **Test mixed content extraction** — All structure types extracted from one document. | Status: not_done
- [ ] **Test metadata population** — `tableCount`, `listCount`, `keyValueCount`, `sectionCount`, `durationMs` populated correctly. | Status: not_done
- [ ] **Test minConfidence filtering** — Low-confidence extractions excluded from results, included in `meta.lowConfidence`. | Status: not_done
- [ ] **Test empty input** — Returns valid empty ParseResult. | Status: not_done
- [ ] **Test null/undefined input** — Throws TypeError. | Status: not_done

### 13f. Type Inference Tests (`src/__tests__/inference.test.ts`)

- [ ] **Test null detection** — All null-like strings map to `null`. | Status: not_done
- [ ] **Test boolean detection** — All boolean-like strings map to `true`/`false`. | Status: not_done
- [ ] **Test boolean context sensitivity** — "No additional config" is not `false`. | Status: not_done
- [ ] **Test integer detection** — `"42"`, `"-7"`, `"0"` become numbers. | Status: not_done
- [ ] **Test float detection** — `"3.14"`, `"-0.5"` become numbers. | Status: not_done
- [ ] **Test comma-separated number detection** — `"1,000"`, `"1,234.56"` become numbers. | Status: not_done
- [ ] **Test scientific notation** — `"1.5e10"`, `"2E-3"` become numbers. | Status: not_done
- [ ] **Test percentage handling** — All three percentage modes: decimal, number, string. | Status: not_done
- [ ] **Test currency handling** — `"$100"` becomes `100` when currency enabled. | Status: not_done
- [ ] **Test phone number exclusion** — `"555-1234"` stays string. | Status: not_done
- [ ] **Test version number exclusion** — `"1.2.3"` stays string. | Status: not_done
- [ ] **Test ZIP code exclusion** — `"02101"` stays string, but `"0"` is a number. | Status: not_done
- [ ] **Test date detection (opt-in)** — ISO dates detected with all three date modes. | Status: not_done
- [ ] **Test array detection (opt-in)** — Comma-separated values split into arrays. | Status: not_done
- [ ] **Test array element inference** — `"1, 2, 3"` becomes `[1, 2, 3]`. | Status: not_done
- [ ] **Test custom inference rules** — Custom rules checked before built-in rules. First match wins. | Status: not_done
- [ ] **Test disabling all inference** — `inference: false` returns all strings. | Status: not_done
- [ ] **Test disabling individual rules** — e.g., `{ numbers: false }` keeps numbers as strings. | Status: not_done

### 13g. Header Normalization Tests (`src/__tests__/headerNormalization.test.ts`)

- [ ] **Test camelCase normalization** — "First Name" becomes "firstName". | Status: not_done
- [ ] **Test snake_case normalization** — "First Name" becomes "first_name". | Status: not_done
- [ ] **Test kebab-case normalization** — "First Name" becomes "first-name". | Status: not_done
- [ ] **Test lowercase normalization** — "First Name" becomes "first name". | Status: not_done
- [ ] **Test preserve normalization** — "First Name" stays "First Name". | Status: not_done
- [ ] **Test markdown stripping from headers** — `**Name**` becomes "name" (camelCase), `` `code` `` becomes "code". | Status: not_done
- [ ] **Test link stripping from headers** — `[Link](url)` becomes "link" (camelCase). | Status: not_done

### 13h. Schema Validation Tests (`src/__tests__/schema.test.ts`)

- [ ] **Test strict mode success** — Valid data passes schema. | Status: not_done
- [ ] **Test strict mode failure** — Invalid data throws ZodError. | Status: not_done
- [ ] **Test partial mode** — Valid rows returned, invalid rows in errors. | Status: not_done
- [ ] **Test coerce mode** — Type coercion applied via Zod. | Status: not_done
- [ ] **Test schema type narrowing** — Return type matches schema's inferred type. | Status: not_done
- [ ] **Test missing Zod error** — Clear error when schema used but Zod not installed. | Status: not_done

### 13i. CLI Tests (`src/__tests__/cli.test.ts`)

- [ ] **Test stdin input** — Pipe markdown to CLI, get JSON output. | Status: not_done
- [ ] **Test --file flag** — Read from file, get JSON output. | Status: not_done
- [ ] **Test --tables flag** — Only tables extracted. | Status: not_done
- [ ] **Test --lists flag** — Only lists extracted. | Status: not_done
- [ ] **Test --key-values flag** — Only key-values extracted. | Status: not_done
- [ ] **Test --sections flag** — Only sections extracted. | Status: not_done
- [ ] **Test --headers flag** — Different normalization modes. | Status: not_done
- [ ] **Test --no-inference flag** — All values remain strings. | Status: not_done
- [ ] **Test --compact flag** — Compact JSON output (no whitespace). | Status: not_done
- [ ] **Test --format csv flag** — CSV output for tables. | Status: not_done
- [ ] **Test --format tsv flag** — TSV output for tables. | Status: not_done
- [ ] **Test --version flag** — Prints version. | Status: not_done
- [ ] **Test --help flag** — Prints usage help. | Status: not_done
- [ ] **Test exit code 0** — Successful extraction. | Status: not_done
- [ ] **Test exit code 1** — No structures found. | Status: not_done
- [ ] **Test exit code 2** — Invalid flags or file not found. | Status: not_done

---

## Phase 14: Performance

- [ ] **Implement single-pass line scanning** — Classify all lines in one pass before extraction. | Status: not_done
- [ ] **Pre-compile all regex patterns** — All regex compiled at module load time, not per call. | Status: not_done
- [ ] **Implement early termination for targeted functions** — `parseTable()` stops after finding the requested table. `parseList()` stops after the first list (unless parseAll). | Status: not_done
- [ ] **Create benchmark suite** — Measure extraction time for small (200B), medium (1KB, 5KB), large (50KB), and very large (100KB) inputs. | Status: not_done
- [ ] **Verify performance targets** — 200B < 0.05ms, 1KB < 0.1ms, 5KB < 0.3ms, 50KB < 3ms, 100KB < 10ms. | Status: not_done

---

## Phase 15: Documentation

- [ ] **Write README.md** — Overview, installation, quick start, API reference, configuration options, CLI usage, examples, and comparison with alternatives. | Status: not_done
- [ ] **Add JSDoc comments to all public functions** — `parse`, `parseAll`, `parseTable`, `parseList`, `parseKeyValue`, `parseSections`, `createParser`. | Status: not_done
- [ ] **Add JSDoc comments to all public types/interfaces** — Every exported type, interface, and type alias. | Status: not_done
- [ ] **Add inline code comments for complex logic** — Disambiguation rules, type inference edge cases, table recovery logic. | Status: not_done

---

## Phase 16: Final Polish and Publishing Prep

- [ ] **Verify zero runtime dependencies** — Confirm package.json has no `dependencies` field (only `devDependencies` and `peerDependencies`). | Status: not_done
- [ ] **Verify `files` field in package.json** — Only `dist/` is published. No source files, tests, or spec. | Status: not_done
- [ ] **Verify TypeScript declaration output** — `dist/index.d.ts` and `.d.ts.map` files generated correctly. | Status: not_done
- [ ] **Run full test suite** — All tests pass: `npm run test`. | Status: not_done
- [ ] **Run linter** — No errors: `npm run lint`. | Status: not_done
- [ ] **Run build** — Clean build: `npm run build`. | Status: not_done
- [ ] **Bump version per roadmap** — Phase 1: 0.1.0 (already set), Phase 2: 0.2.0, Phase 3: 0.3.0, Phase 4: 1.0.0. | Status: not_done
- [ ] **Dry-run npm publish** — `npm publish --dry-run` to verify package contents. | Status: not_done
