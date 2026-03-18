# md-to-data -- Specification

## 1. Overview

`md-to-data` is a deterministic extraction library that parses markdown-formatted LLM responses -- tables, bullet lists, key-value pairs, definition lists, checkbox lists, and sectioned content -- into typed JSON objects. It accepts a raw markdown string, identifies the structural elements within it, and returns structured JavaScript data: tables become arrays of objects keyed by column headers, key-value lists become plain objects, ordered and unordered lists become arrays, checkbox lists become arrays with boolean `checked` fields, and header-delimited sections become nested objects. Every extracted string value passes through a configurable type inference layer that converts `"42"` to `42`, `"yes"` to `true`, `"N/A"` to `null`, and `"2024-01-15"` to a Date object (opt-in), producing output that is immediately usable without manual parsing.

The gap this package fills is specific and well-defined. LLMs frequently return structured data as markdown rather than JSON. Ask Claude to compare three products and it returns a markdown table. Ask GPT-4o for a summary of findings and it returns a bullet list with bold keys. Ask Gemini to list configuration options and it returns a definition-style list with colons. Ask any model for a detailed breakdown and it returns sections under markdown headers. In every case, the developer needs the data as a JavaScript object or array, not as a formatted string. Today, every team writes ad-hoc regex to extract table rows, split on `|`, trim whitespace, detect `**bold**` keys, and manually parse `"true"` and `"42"` into their native types. This boilerplate is repeated across thousands of codebases, breaks on edge cases (escaped pipes, multiline cells, tables without proper separators), and is never comprehensive enough to handle the full range of markdown structures LLMs produce.

Existing tools address fragments of this problem but not the whole. `markdown-tables-to-json` (npm, last published 5 years ago) extracts tables from markdown and converts them to JSON, but it handles only strict GFM tables with proper pipe separators and header rows -- it fails on LLM-style tables that omit outer pipes, lack proper separator rows, or have misaligned columns. It performs no type inference, returning all values as strings. It does not handle lists, key-value pairs, or sectioned content. `md-2-json` converts markdown into a nested JSON structure based on headers, but it produces a document-level hierarchy rather than extracting structured data from within sections. `parse-markdown-table` focuses exclusively on table parsing with no list or key-value support. `@loopstack/markdown-parser` maps markdown to JSON via JSON Schema definitions but requires schema authoring upfront and does not handle LLM-specific quirks. On the Python side, tools like `markdownify` and `beautifulsoup` operate on HTML rather than markdown text, and `pandas.read_markdown` (via `pandas`) reads strict tables but has no LLM-quirk tolerance. The general-purpose markdown parsers -- `remark`, `marked`, `markdown-it` -- parse markdown into ASTs optimized for rendering to HTML, not for data extraction. Extracting a table from a `remark` AST requires traversing tree nodes, mapping column indices to header names, and manually assembling objects -- exactly the boilerplate `md-to-data` eliminates.

`md-to-data` provides a single, focused package that handles the entire extraction pipeline: identify markdown structures, parse them into typed data, and return clean JavaScript objects. It is purpose-built for LLM output, meaning it tolerates the formatting imperfections that LLMs produce: misaligned columns, missing separator rows, inconsistent pipe placement, bold keys with varying colon placement, mixed list markers, and nested content within cells. It works with output from any LLM (OpenAI, Anthropic, Google, Mistral, local models) because it operates on the final markdown string, not on provider-specific response structures. It requires no API keys, no schema definitions, and no external LLM calls. It runs in microseconds on typical input, making it suitable for high-throughput production pipelines.

The design philosophy is progressive extraction with type safety. The `parse()` function auto-detects what markdown structures are present and extracts all of them. The targeted functions -- `parseTable()`, `parseList()`, `parseKeyValue()`, `parseSections()` -- extract a specific structure type when the caller knows what to expect. The type inference layer converts string values to their native JavaScript types by default, with full configurability: disable all inference, enable only specific types, or provide custom parsers. Optional schema validation via Zod integration ensures the extracted data matches an expected shape, bridging the gap between unstructured LLM markdown and strongly-typed application code.

The relationship to `llm-output-normalizer` is complementary and non-overlapping. `llm-output-normalizer` extracts JSON and code blocks from raw LLM output, handling preambles, postambles, markdown fences, thinking blocks, and malformed JSON. It does not parse markdown structures (tables, lists, key-value pairs) into data objects. `md-to-data` picks up where `llm-output-normalizer` leaves off: when the LLM response is not JSON wrapped in markdown fences but is instead natively markdown-formatted data (a table, a list, a key-value breakdown), `md-to-data` extracts the structured data. The two packages can be composed in a pipeline: `llm-output-normalizer` strips preambles and postambles, then `md-to-data` parses the cleaned markdown into typed objects.

---

## 2. Goals and Non-Goals

### Goals

- Provide a single function (`parse`) that accepts a markdown string from an LLM response and returns all extractable structured data: tables, lists, key-value pairs, and sectioned content.
- Provide targeted extraction functions (`parseTable`, `parseList`, `parseKeyValue`, `parseSections`) for callers who know the expected structure.
- Extract GFM pipe tables into `Record<string, unknown>[]` where column headers become object keys and cell values are type-inferred.
- Extract bullet lists (`-`, `*`, `+`), ordered lists (`1.`, `1)`), and checkbox lists (`- [x]`, `- [ ]`) into typed arrays.
- Extract key-value patterns from LLM output: `**Key**: Value`, `Key: Value`, colon-separated pairs, and bold-key lists.
- Extract header-delimited sections into nested objects keyed by header text.
- Apply configurable type inference to all extracted string values: numbers, booleans, null/empty, dates (opt-in), arrays (opt-in).
- Tolerate LLM-specific markdown quirks: misaligned columns, missing separator rows, inconsistent pipes, mixed list markers, nested markdown in cells.
- Apply only deterministic, rule-based extraction. No LLM calls, no model inference, no network access. The same input always produces the same output.
- Provide optional schema validation via Zod integration, enabling callers to validate extracted data against an expected shape with type coercion guided by the schema.
- Provide a CLI (`md-to-data`) that reads markdown from stdin or a file and writes extracted JSON to stdout.
- Keep dependencies minimal: zero runtime dependencies. All parsing is implemented using hand-written scanners and regex patterns.
- Work with markdown output from any LLM provider. The package operates on plain markdown strings.

### Non-Goals

- **Not a full markdown parser.** This package does not parse markdown into an AST, does not render markdown to HTML, and does not handle the full CommonMark or GFM specification. It extracts data-carrying structures (tables, lists, key-value pairs) from markdown. For full markdown parsing, use `remark`, `marked`, or `markdown-it`.
- **Not a JSON extractor.** This package does not extract JSON from code fences, repair malformed JSON, or strip conversational preambles. That is what `llm-output-normalizer` does. `md-to-data` handles markdown-native structures that are not JSON.
- **Not a markdown renderer.** This package does not convert markdown to HTML, PDF, or any display format. It converts markdown to data.
- **Not an LLM prompt tool.** This package does not generate prompts, constrain output format, or interact with LLM APIs. It operates entirely on the output side, post-response.
- **Not a CSV parser.** While markdown tables share structural similarity with CSV (rows and columns), this package parses pipe-delimited markdown tables with headers, separators, and embedded markdown formatting. For CSV parsing, use `csv-parse` or `papaparse`.
- **Not a schema generator.** This package does not infer TypeScript types or JSON Schema from extracted data. It extracts data and optionally validates it against a provided schema.

---

## 3. Target Users and Use Cases

### AI Application Developers

Developers building applications that call LLM APIs and receive markdown-formatted responses. They ask GPT-4o to compare three database options and receive a markdown table with columns for "Database", "Latency", "Cost", "Scalability". They need `[{ database: "PostgreSQL", latency: "5ms", cost: 0, scalability: "High" }, ...]` as a JavaScript array. A typical integration is: `const comparison = parseTable(response.content)`.

### Data Pipeline Builders

Teams building multi-step pipelines where an LLM produces intermediate results as markdown tables or lists, and the next step requires structured JSON. For example, an LLM summarizes 50 documents into a markdown table of key findings, and the pipeline ingests each row as a record for downstream processing. `md-to-data` sits between the LLM output and the data ingestion layer.

### Report and Analysis Processors

Teams that use LLMs to analyze data and produce reports in markdown format. The report contains tables of metrics, lists of recommendations, and key-value summaries. `md-to-data` extracts each structural element into typed objects for storage, aggregation, or display in dashboards.

### Agent and Tool Builders

Developers building AI agents that use LLMs to populate structured forms, generate configuration objects, or produce inventories. The agent prompts the LLM to list items with properties, and the LLM responds with a bullet list of key-value pairs. `md-to-data` converts the list into an array of objects that the agent can process programmatically.

### CLI and Shell Script Authors

Engineers who pipe LLM markdown output through shell pipelines. `llm-call "compare X and Y" | md-to-data --tables | jq '.[0].cost'` -- the CLI bridges LLM markdown output and standard Unix JSON processing tools like `jq`.

### Local Model Integrators

Developers using open-source models (Llama, Mistral, Phi, Qwen) that frequently produce markdown tables and lists rather than structured JSON, especially when not using structured output modes. Local models are more prone to formatting inconsistencies -- missing separator rows, uneven column widths, mixed list markers. `md-to-data` handles these quirks without requiring model-specific prompt engineering.

---

## 4. Core Concepts

### Markdown Structure

A markdown structure is a recognizable formatting pattern in markdown text that encodes structured data. `md-to-data` recognizes six categories of markdown structures:

| Structure | Markdown Pattern | Extracted Data Shape |
|---|---|---|
| Table | Pipe-delimited rows with header and separator | `Record<string, unknown>[]` |
| Unordered list | Lines starting with `-`, `*`, or `+` | `string[]` or `Record<string, unknown>[]` |
| Ordered list | Lines starting with `1.`, `2.`, etc. | `string[]` or `Record<string, unknown>[]` |
| Checkbox list | Lines starting with `- [x]` or `- [ ]` | `{ text: string, checked: boolean }[]` |
| Key-value pairs | `Key: Value` or `**Key**: Value` patterns | `Record<string, unknown>` |
| Sections | Header lines (`#`, `##`, etc.) with body content | Nested `Record<string, unknown>` |

### Extraction Target

An extraction target is the specific data type that a parsing function produces from a markdown structure. Every extraction target is a plain JavaScript value -- object, array, string, number, boolean, or null. No custom classes, no wrapper types. The extracted data is immediately serializable with `JSON.stringify` and immediately usable in application logic.

### Type Inference

Type inference is the process of converting string values extracted from markdown into their native JavaScript types. When a table cell contains `"42"`, the question is whether the extracted value should be the string `"42"` or the number `42`. Type inference answers this question by applying a configurable set of detection rules to every extracted string value.

The inference rules are applied in priority order:

1. **Null detection**: `"N/A"`, `"n/a"`, `"NA"`, `"None"`, `"none"`, `"null"`, `"-"`, `""`, `"—"` (em dash) map to `null`.
2. **Boolean detection**: `"true"`, `"yes"`, `"on"`, `"1"` (when context suggests boolean) map to `true`. `"false"`, `"no"`, `"off"`, `"0"` (when context suggests boolean) map to `false`.
3. **Number detection**: Strings matching integer patterns (`"42"`, `"-7"`, `"1,000"`), float patterns (`"3.14"`, `"-0.5"`, `"1,234.56"`), scientific notation (`"1.5e10"`, `"2E-3"`), and percentage patterns (`"95%"` maps to `0.95`) map to numbers.
4. **Date detection** (opt-in): ISO 8601 strings (`"2024-01-15"`, `"2024-01-15T10:30:00Z"`) map to Date objects or ISO strings depending on configuration.
5. **Array detection** (opt-in): Comma-separated values within a single cell (`"red, green, blue"`) map to `["red", "green", "blue"]`.
6. **String passthrough**: Everything else remains a string.

Each rule can be individually enabled or disabled. Custom inference functions can be added for domain-specific types.

### Header Normalization

When extracting tables, column header text is used as object keys. Raw header text may contain spaces, special characters, mixed casing, and markdown formatting. Header normalization transforms raw header text into clean object keys.

Supported normalization modes:

| Mode | Raw Header | Normalized Key |
|---|---|---|
| `preserve` | `"First Name"` | `"First Name"` |
| `camelCase` (default) | `"First Name"` | `"firstName"` |
| `snake_case` | `"First Name"` | `"first_name"` |
| `kebab-case` | `"First Name"` | `"first-name"` |
| `lowercase` | `"First Name"` | `"first name"` |

All modes strip markdown formatting from headers: `**Name**` becomes `Name`, `` `code` `` becomes `code`, `[Link](url)` becomes `Link`.

### Confidence and Ambiguity

Some markdown patterns are ambiguous. A line like `Name: John Doe` could be a key-value pair or prose. A line like `- Item one` could be a list item or a horizontal rule fragment. `md-to-data` resolves ambiguity using contextual heuristics and assigns a confidence score (0.0 to 1.0) to each extraction. Tables with proper header separators get confidence 1.0. Key-value pairs detected by the `**Bold**: Value` pattern get confidence 0.95. Free-form colon-separated pairs in prose get confidence 0.6. Callers can filter extractions by minimum confidence to control precision.

---

## 5. Supported Markdown Structures

### 5.1 Pipe Tables (GFM)

The primary table format. A header row, a separator row, and zero or more data rows, with cells delimited by pipe characters.

**Standard format**:
```
| Name   | Age | City     |
|--------|-----|----------|
| Alice  | 30  | New York |
| Bob    | 25  | London   |
```

**Variations handled**:

| Variation | Example | Notes |
|---|---|---|
| No outer pipes | `Name \| Age \| City` | LLMs frequently omit leading/trailing pipes |
| Minimal separators | `\|---\|---\|---\|` | Three dashes minimum per GFM spec |
| Alignment markers | `\|:---\|:---:\|---:\|` | Left, center, right alignment |
| Extra whitespace | `\| Name    \| Age \|` | Whitespace is trimmed |
| Misaligned columns | Columns of uneven width | Common LLM quirk |
| Empty cells | `\| Alice \| \| London \|` | Extracted as null (with type inference) or empty string |
| Nested markdown | `\| **Alice** \| 30 \| \`NYC\` \|` | Bold, code, links in cells |
| Escaped pipes | `\| 5 \\| 10 \| range \|` | `\|` treated as literal pipe |

**Missing separator row**: LLMs sometimes produce tables without the `|---|---|` separator row. `md-to-data` detects this by identifying consecutive pipe-delimited lines with consistent column counts and treats the first row as headers even without a separator. This extraction receives a lower confidence score (0.7 vs 1.0 for tables with separators).

**Multi-table documents**: When a markdown document contains multiple tables, `parseTable()` extracts the first by default. The `tableIndex` option selects a specific table by zero-based index. The `parse()` function extracts all tables.

### 5.2 Unordered Lists

Lines starting with `-`, `*`, or `+` followed by a space.

**Simple lists** extract to string arrays:

```
- PostgreSQL
- MySQL
- MongoDB
```

Extracts to: `["PostgreSQL", "MySQL", "MongoDB"]`

**Key-value lists** extract to objects when items contain a key-value pattern:

```
- **Name**: Alice
- **Age**: 30
- **City**: New York
```

Extracts to: `{ name: "Alice", age: 30, city: "New York" }`

**Nested lists** extract to nested arrays or objects:

```
- Databases
  - PostgreSQL
  - MySQL
- Caches
  - Redis
  - Memcached
```

Extracts to: `[{ label: "Databases", children: ["PostgreSQL", "MySQL"] }, { label: "Caches", children: ["Redis", "Memcached"] }]`

**Mixed list markers**: LLMs sometimes mix `-`, `*`, and `+` within the same list. `md-to-data` treats all three as equivalent unordered list markers.

### 5.3 Ordered Lists

Lines starting with a number followed by `.` or `)` and a space.

```
1. Initialize the database
2. Run migrations
3. Start the server
```

Extracts to: `["Initialize the database", "Run migrations", "Start the server"]`

Ordered lists can also contain key-value patterns and nested items, following the same rules as unordered lists.

**Non-sequential numbering**: LLMs sometimes produce `1. 1. 1.` (repeated numbering) or skip numbers. `md-to-data` treats any line matching `\d+[.)]\s` as an ordered list item, ignoring the actual number values.

### 5.4 Checkbox Lists

Lines starting with `- [ ]` (unchecked) or `- [x]`/`- [X]` (checked).

```
- [x] Set up database
- [x] Create API endpoints
- [ ] Write unit tests
- [ ] Deploy to production
```

Extracts to:
```json
[
  { "text": "Set up database", "checked": true },
  { "text": "Create API endpoints", "checked": true },
  { "text": "Write unit tests", "checked": false },
  { "text": "Deploy to production", "checked": false }
]
```

Checkbox lists are a specialization of unordered lists. If a list contains at least one checkbox pattern, the entire list is treated as a checkbox list.

### 5.5 Definition Lists

A term on one line followed by a definition on the next line starting with `:` and a space.

```
Latency
: The time between a request and a response

Throughput
: The number of requests processed per unit of time

Availability
: The percentage of time a system is operational
```

Extracts to:
```json
{
  "Latency": "The time between a request and a response",
  "Throughput": "The number of requests processed per unit of time",
  "Availability": "The percentage of time a system is operational"
}
```

Definition lists are not part of GFM or CommonMark, but are supported by many markdown processors (PHP Markdown Extra, kramdown, pandoc) and are produced by LLMs when asked for glossaries or term definitions. `md-to-data` detects them by the `term\n: definition` pattern.

### 5.6 Key-Value Pairs

Free-form key-value patterns in LLM output. These are not a standard markdown construct but are a pervasive pattern in LLM responses.

**Bold-key pattern** (highest confidence, 0.95):

```
**Name**: Alice Johnson
**Age**: 30
**Location**: San Francisco, CA
**Active**: Yes
```

Extracts to: `{ name: "Alice Johnson", age: 30, location: "San Francisco, CA", active: true }`

**Plain colon pattern** (moderate confidence, 0.7):

```
Name: Alice Johnson
Age: 30
Location: San Francisco, CA
```

Extracts to: `{ name: "Alice Johnson", age: 30, location: "San Francisco, CA" }`

**Bold-key in list** (high confidence, 0.9):

```
- **Name**: Alice Johnson
- **Role**: Engineer
- **Team**: Platform
```

Extracts to: `{ name: "Alice Johnson", role: "Engineer", team: "Platform" }`

**Detection heuristics**: A colon-separated line is treated as a key-value pair if:
1. The key portion is short (under 50 characters) and does not contain sentence-like structures (multiple words with articles, conjunctions).
2. The colon is not part of a URL (`http:`, `https:`, `ftp:`).
3. The colon is not inside a code span.
4. The line is part of a consecutive group of similarly structured lines (at least two colon-separated lines in sequence boost confidence).

### 5.7 Sectioned Content

Markdown headers (`#` through `######`) delimit sections. Content under each header is extracted as the section's value.

```
## Summary

The project is on track for Q2 delivery.

## Key Metrics

- Revenue: $1.2M
- Users: 50,000
- Uptime: 99.9%

## Recommendations

1. Scale the database cluster
2. Add CDN for static assets
```

Extracts to:
```json
{
  "Summary": "The project is on track for Q2 delivery.",
  "Key Metrics": {
    "revenue": "$1.2M",
    "users": 50000,
    "uptime": "99.9%"
  },
  "Recommendations": [
    "Scale the database cluster",
    "Add CDN for static assets"
  ]
}
```

Each section's body content is recursively parsed. If the body contains a table, the section value is the table's extracted data. If it contains a key-value list, the section value is the extracted object. If it contains a plain list, the section value is the extracted array. If it contains prose, the section value is the text string. Nested headers create nested objects.

### 5.8 Mixed Content

Real LLM responses often combine multiple structures. A response may contain introductory prose, a table, a list of notes, and key-value metadata. The `parse()` function handles mixed content by scanning the markdown for all recognizable structures and returning them in a unified result.

```
Here is the comparison:

| Feature   | PostgreSQL | MongoDB  |
|-----------|-----------|----------|
| Type      | SQL       | NoSQL    |
| Scaling   | Vertical  | Horizontal |

Key points:
- **Winner**: PostgreSQL for consistency
- **Runner-up**: MongoDB for flexibility

Summary:
Status: Complete
Confidence: High
```

The `parse()` function extracts all three structures (table, key-value list, key-value pairs) and returns them in the unified result object.

---

## 6. Table Extraction

### Parsing Algorithm

Table extraction operates in three phases: detection, parsing, and type inference.

**Phase 1: Detection**

The detector scans the input line by line, looking for consecutive lines that match table row patterns. A line is a candidate table row if it:

1. Contains at least one unescaped pipe character (`|`).
2. Is not a horizontal rule (`---`, `***`, `___`).
3. Is not inside a code fence (`` ``` `` or `~~~`).

A candidate table is a sequence of consecutive candidate rows where:
- The column count is consistent across all rows (or within a tolerance of one column, to handle LLM quirks).
- At least two rows are present (a header and at least one data row).

The detector also identifies the separator row -- a row where every cell contains only dashes, colons, and spaces (matching the pattern `/^[\s|:\-]+$/`). If a separator row is found, it divides the table into header (rows above) and body (rows below). If no separator row is found, the first row is assumed to be the header.

**Phase 2: Parsing**

Each table row is parsed by splitting on unescaped pipe characters. Escaped pipes (`\|`) are preserved as literal pipe characters in the cell content. Leading and trailing pipes are stripped. Cell content is trimmed of whitespace.

```
function parseRow(line: string): string[] {
  // Handle escaped pipes by replacing with placeholder
  const escaped = line.replace(/\\\|/g, '\x00');
  // Split on unescaped pipes
  const cells = escaped.split('|');
  // Remove leading/trailing empty cells from outer pipes
  if (cells[0].trim() === '') cells.shift();
  if (cells[cells.length - 1].trim() === '') cells.pop();
  // Restore escaped pipes and trim
  return cells.map(cell => cell.replace(/\x00/g, '|').trim());
}
```

Headers are extracted from the first row. Each header is normalized according to the configured normalization mode (default: `camelCase`). Markdown formatting is stripped from headers: `**bold**` becomes `bold`, `` `code` `` becomes `code`, `[text](url)` becomes `text`.

Data rows are mapped to objects using the normalized headers as keys. If a data row has fewer cells than headers, the missing cells are set to `null`. If a data row has more cells than headers, the extra cells are ignored.

**Phase 3: Type Inference**

Each cell value string passes through the type inference pipeline. The inferred type replaces the raw string in the output object. See section 9 for the complete type inference specification.

### Column Alignment Detection

The separator row can indicate column alignment:

| Separator Pattern | Alignment |
|---|---|
| `---` or `----` | Left (default) |
| `:---` or `:----` | Left (explicit) |
| `:---:` or `:----:` | Center |
| `---:` or `----:` | Right |

Alignment information is available in the extraction metadata but does not affect the extracted data values. It is useful for downstream rendering or for heuristic type inference (right-aligned columns are likely numeric).

### Multi-Table Extraction

When the input contains multiple tables separated by non-table content:

```
## Databases

| Name | Type |
|------|------|
| PG   | SQL  |

## Caches

| Name  | Type    |
|-------|---------|
| Redis | In-mem  |
```

The `parseTable()` function returns the first table by default. The `tableIndex` option selects a specific table. The `parse()` function returns all tables in the `tables` array of the result.

### Handling Markdown in Cells

Cell content may contain inline markdown:

| Markdown | Handling |
|---|---|
| `**bold**` | Stripped to plain text by default. Preserved with `stripMarkdown: false`. |
| `*italic*` / `_italic_` | Stripped to plain text by default. |
| `` `code` `` | Stripped to plain text by default. |
| `[text](url)` | Extracted as `text` by default. Full link preserved with `stripMarkdown: false`. |
| `![alt](img)` | Extracted as `alt` text by default. |
| `<br>` / `<br/>` | Replaced with newline character. |

### Tables Without Headers

Some LLMs produce tables without a clear header row -- just rows of data. `md-to-data` handles this by:

1. If no separator row is found and `headerless: true` is configured, all rows are treated as data rows. Column keys are generated as `column1`, `column2`, etc.
2. If the first row appears to contain labels (short, title-cased text) while subsequent rows contain values (numbers, longer text), the first row is heuristically treated as headers. Confidence is reduced to 0.6.

---

## 7. List Extraction

### Detection

List detection scans for consecutive lines matching list item patterns:

| List Type | Pattern | Regex |
|---|---|---|
| Unordered | `- item`, `* item`, `+ item` | `/^(\s*)[*+-]\s+(.+)$/` |
| Ordered | `1. item`, `1) item` | `/^(\s*)\d+[.)]\s+(.+)$/` |
| Checkbox | `- [x] item`, `- [ ] item` | `/^(\s*)[*+-]\s+\[([ xX])\]\s+(.+)$/` |

Lines between list items that are indented beyond the list level are treated as continuation lines (multi-line items). Blank lines between items do not break the list unless followed by non-list content.

### Simple List Extraction

When list items are plain text without key-value patterns:

```
- PostgreSQL
- MySQL
- SQLite
```

The result is a string array: `["PostgreSQL", "MySQL", "SQLite"]`. Type inference is applied to each item, so `- 42` becomes the number `42` in the array.

### Key-Value List Extraction

When list items contain a recognizable key-value pattern, the list is extracted as an object:

**Pattern 1: Bold key with colon**

```
- **Host**: localhost
- **Port**: 5432
- **Database**: myapp
```

Regex: `/^\*\*(.+?)\*\*:\s*(.+)$/`

Extracts to: `{ host: "localhost", port: 5432, database: "myapp" }`

**Pattern 2: Plain key with colon**

```
- Host: localhost
- Port: 5432
- Database: myapp
```

Regex: `/^([^:]{1,50}):\s+(.+)$/`

Extracts to: `{ host: "localhost", port: 5432, database: "myapp" }`

**Pattern 3: Bold key without colon** (colon inside the bold)

```
- **Host:** localhost
- **Port:** 5432
```

Regex: `/^\*\*(.+?):\*\*\s*(.+)$/`

**Detection heuristic**: A list is treated as a key-value list if at least 50% of its items match one of the key-value patterns. Items that do not match are included with auto-generated keys (`item1`, `item2`, etc.) or as a special `_other` array, depending on configuration.

### Nested List Extraction

Nested lists are detected by indentation. Each level of indentation (2 or 4 spaces, or 1 tab) indicates one level of nesting.

```
- Databases
  - SQL
    - PostgreSQL
    - MySQL
  - NoSQL
    - MongoDB
    - Redis
- Message Queues
  - RabbitMQ
  - Kafka
```

The result is a nested structure:

```json
[
  {
    "label": "Databases",
    "children": [
      {
        "label": "SQL",
        "children": ["PostgreSQL", "MySQL"]
      },
      {
        "label": "NoSQL",
        "children": ["MongoDB", "Redis"]
      }
    ]
  },
  {
    "label": "Message Queues",
    "children": ["RabbitMQ", "Kafka"]
  }
]
```

When a parent item has no text content of its own (just children), the `label` field contains the parent text and `children` contains the nested items. When a parent item has both text and children, both are present. Leaf items (no children) are represented as plain strings within their parent's `children` array.

### Checkbox List Extraction

Checkbox items are extracted with their checked state:

```
- [x] Database setup
- [x] API implementation
- [ ] Frontend integration
- [ ] Testing
```

Result:

```json
[
  { "text": "Database setup", "checked": true },
  { "text": "API implementation", "checked": true },
  { "text": "Frontend integration", "checked": false },
  { "text": "Testing", "checked": false }
]
```

Both `[x]` and `[X]` are treated as checked. Any list containing at least one checkbox item is extracted as a checkbox list. Non-checkbox items in a mixed list are treated as unchecked.

### Multi-Line List Items

LLM output sometimes includes list items that span multiple lines:

```
- **Database**: PostgreSQL 15 with PostGIS extension
  for geospatial queries and full-text search
- **Cache**: Redis 7 cluster with sentinel
  for high availability
```

Continuation lines (indented lines following a list item) are concatenated to the item text with a space separator. The key-value pattern is matched against the concatenated text.

---

## 8. Key-Value Extraction

### Detection and Parsing

Key-value extraction handles structured data that is neither a table nor a list but consists of labeled fields. This is common in LLM output when the model produces a summary, profile, or metadata block.

**Pattern priority order** (highest confidence first):

1. **Bold-key colon** (`**Key**: Value`): Confidence 0.95. The strongest signal because bold formatting explicitly marks the key, and the colon separates it from the value.

2. **Bold-key colon inside** (`**Key:** Value`): Confidence 0.95. Variant where the colon is inside the bold markers.

3. **Header-grouped key-values**: Confidence 0.9. Key-value pairs grouped under a markdown header. The header becomes a parent key, and the pairs below it become nested values.

4. **Definition list** (`Term\n: Definition`): Confidence 0.85. The colon-space at the start of the definition line is a strong structural signal.

5. **Plain colon in list** (`- Key: Value`): Confidence 0.8. A list item with a colon-separated key-value pair, but without bold formatting.

6. **Plain colon standalone** (`Key: Value`): Confidence 0.7. Free-form colon-separated pairs. Requires consecutive lines with the same pattern to distinguish from prose containing colons.

### Multi-Line Values

Values that span multiple lines are detected by indentation:

```
**Description**: This is a long description
  that continues on the next line and provides
  additional context about the item.
**Status**: Active
```

Lines indented beyond the key-value pair's starting position are treated as continuation lines and concatenated to the value.

### Header-Grouped Key-Values

When key-value pairs appear under markdown headers, the header text becomes a parent key:

```
## Server Configuration

**Host**: db.example.com
**Port**: 5432
**SSL**: Enabled

## Application Settings

**Workers**: 4
**Timeout**: 30s
**Debug**: false
```

Extracts to:

```json
{
  "Server Configuration": {
    "host": "db.example.com",
    "port": 5432,
    "ssl": "Enabled"
  },
  "Application Settings": {
    "workers": 4,
    "timeout": "30s",
    "debug": false
  }
}
```

### Disambiguation Rules

Colon-separated text is everywhere in natural language ("Note: this is important", "Time: 3:45 PM", "See: https://example.com"). The following rules prevent false-positive key-value extraction:

1. **URL exclusion**: If the value portion starts with `//` (suggesting `http://` or `https://`), the entire line is not a key-value pair. The regex for URL detection: `/^https?:/`, `ftp:/`, `mailto:`.
2. **Time exclusion**: If the key-like portion is `Time` or similar and the value matches a time pattern (`\d{1,2}:\d{2}`), the colon is part of the time, not a key-value separator. Handled by checking if the value starts with a digit followed by a colon.
3. **Sentence exclusion**: If the key-like portion contains more than 6 words, it is probably a sentence fragment, not a key. Keys in LLM output are typically 1-4 words.
4. **Minimum group size**: Standalone colon-separated lines require at least two consecutive lines with the same pattern to be treated as key-value pairs. A single isolated `Key: Value` line in the middle of prose is not extracted.
5. **Prose context**: If the surrounding lines are clearly prose (long sentences, paragraphs), colon-separated lines are not extracted even if they match the pattern.

---

## 9. Type Inference

### Inference Pipeline

Every string value extracted from a markdown structure passes through the type inference pipeline. The pipeline applies detection rules in priority order. The first rule that matches determines the inferred type. If no rule matches, the value remains a string.

### Null Detection

| Input String | Inferred Value | Case-Sensitive |
|---|---|---|
| `""` (empty string) | `null` | N/A |
| `"N/A"` | `null` | No |
| `"n/a"` | `null` | No |
| `"NA"` | `null` | No |
| `"None"` | `null` | No |
| `"none"` | `null` | No |
| `"null"` | `null` | No |
| `"NULL"` | `null` | No |
| `"-"` | `null` | N/A |
| `"--"` | `null` | N/A |
| `"---"` | `null` | N/A |
| `"\u2014"` (em dash) | `null` | N/A |
| `"undefined"` | `null` | No |

The null detection rule only applies when `inferNull` is enabled (default: `true`). When disabled, these strings pass through as-is.

### Boolean Detection

| Input String | Inferred Value | Case-Sensitive |
|---|---|---|
| `"true"` | `true` | No |
| `"True"` | `true` | No |
| `"TRUE"` | `true` | No |
| `"yes"` | `true` | No |
| `"Yes"` | `true` | No |
| `"on"` | `true` | No |
| `"enabled"` | `true` | No |
| `"false"` | `false` | No |
| `"False"` | `false` | No |
| `"FALSE"` | `false` | No |
| `"no"` | `false` | No |
| `"No"` | `false` | No |
| `"off"` | `false` | No |
| `"disabled"` | `false` | No |

Checkbox values (`[x]` and `[ ]`) are always inferred as booleans regardless of this setting, since the checkbox syntax is unambiguous.

Boolean detection is context-sensitive to reduce false positives. The word `"no"` is only inferred as `false` when it appears as a standalone cell value, not when it is part of a longer string like `"No additional configuration required"`. The heuristic: if the trimmed string is exactly one of the boolean keywords and nothing else, it is a boolean.

### Number Detection

| Input Pattern | Example | Inferred Value |
|---|---|---|
| Integer | `"42"` | `42` |
| Negative integer | `"-7"` | `-7` |
| Float | `"3.14"` | `3.14` |
| Negative float | `"-0.5"` | `-0.5` |
| Comma-separated integer | `"1,000"` | `1000` |
| Comma-separated float | `"1,234.56"` | `1234.56` |
| Scientific notation | `"1.5e10"` | `15000000000` |
| Scientific notation (negative exponent) | `"2E-3"` | `0.002` |
| Percentage | `"95%"` | `0.95` |
| Currency prefix | `"$100"` | `100` (with `inferCurrency: true`) |

**Number detection regex**: `/^-?[\d,]+\.?\d*(?:[eE][+-]?\d+)?$/` after stripping currency symbols and percent signs.

**Percentage handling**: When `inferPercentages` is enabled (default: `true`), values ending with `%` are divided by 100. When disabled, `"95%"` remains the string `"95%"`. Configurable via the `percentageMode` option: `'decimal'` (default, divides by 100), `'number'` (returns 95 as a number), or `'string'` (preserves as-is).

**Currency handling**: When `inferCurrency` is enabled (default: `false`), leading currency symbols (`$`, `EUR`, `GBP`, etc.) are stripped before number parsing. The currency symbol is discarded -- if the caller needs the currency, they should disable currency inference and parse manually.

**Guard against false positives**: Strings that look numeric but are not semantically numbers are excluded:
- Phone numbers: `"555-1234"`, `"+1-800-555-0199"` -- contain dashes in non-negation positions.
- Version numbers: `"1.2.3"`, `"v2.0"` -- contain multiple dots or a leading `v`.
- ZIP codes: `"02101"` -- leading zero suggests string semantics. However, `"0"` and `"0.5"` are valid numbers.
- Dates: `"2024-01-15"` -- handled by date detection, not number detection.

### Date Detection (Opt-In)

When `inferDates` is enabled (default: `false`):

| Input Pattern | Example | Inferred Value |
|---|---|---|
| ISO 8601 date | `"2024-01-15"` | `new Date("2024-01-15")` or `"2024-01-15"` |
| ISO 8601 datetime | `"2024-01-15T10:30:00Z"` | `new Date("2024-01-15T10:30:00Z")` |
| ISO 8601 with offset | `"2024-01-15T10:30:00+05:30"` | `new Date(...)` |

The `dateMode` option controls the output format:
- `'date'`: Returns a JavaScript `Date` object.
- `'iso'` (default when enabled): Returns the ISO 8601 string as-is (no conversion, no timezone interpretation). This avoids timezone-related surprises.
- `'timestamp'`: Returns the Unix timestamp in milliseconds.

Date detection does not attempt to parse natural language dates ("January 15, 2024", "last Tuesday"). Only ISO 8601 formats are detected, because they are unambiguous. Natural language date parsing requires a library like `chrono-node` and is out of scope.

### Array Detection (Opt-In)

When `inferArrays` is enabled (default: `false`):

A cell value containing comma-separated items is split into an array:

| Input | Inferred Value |
|---|---|
| `"red, green, blue"` | `["red", "green", "blue"]` |
| `"1, 2, 3"` | `[1, 2, 3]` |
| `"Alice, Bob"` | `["Alice", "Bob"]` |

**Heuristic**: A value is treated as an array if:
1. It contains at least one comma.
2. The items between commas are short (under 50 characters each).
3. The value is not a prose sentence (does not contain conjunctions like "and", "or", "but" after the last comma in a two-item list, suggesting natural enumeration rather than a data array).

Each array element passes through type inference individually, so `"1, 2, 3"` becomes `[1, 2, 3]` (numbers), not `["1", "2", "3"]`.

### Custom Inference Functions

Callers can provide custom inference functions that run before the built-in rules:

```typescript
const result = parseTable(markdown, {
  customInference: [
    {
      name: 'status',
      test: (value: string) => /^(active|inactive|pending)$/i.test(value),
      transform: (value: string) => value.toLowerCase(),
    },
    {
      name: 'duration',
      test: (value: string) => /^\d+\s*(ms|s|m|h)$/.test(value),
      transform: (value: string) => {
        const match = value.match(/^(\d+)\s*(ms|s|m|h)$/);
        const num = parseInt(match![1], 10);
        const unit = match![2];
        return { value: num, unit };
      },
    },
  ],
});
```

Custom inference functions are checked in order before the built-in rules. The first function whose `test` returns `true` determines the inferred type via its `transform`.

### Disabling Inference

Type inference can be disabled entirely or per-type:

```typescript
// Disable all inference -- all values remain strings
parseTable(markdown, { inference: false });

// Disable only number inference
parseTable(markdown, { inference: { numbers: false } });

// Disable dates and arrays, keep everything else
parseTable(markdown, { inference: { dates: false, arrays: false } });
```

---

## 10. API Surface

### Installation

```bash
npm install md-to-data
```

### No Runtime Dependencies

`md-to-data` has zero runtime dependencies. All parsing -- regex pattern matching, line scanning, type inference, header normalization -- is implemented using Node.js built-in APIs and hand-written code. The optional Zod integration is a peer dependency, not a runtime dependency.

### Auto-Detect: `parse`

The primary API. Accepts a markdown string and returns all extractable structured data.

```typescript
import { parse } from 'md-to-data';

const markdown = `
## Comparison

| Database   | Latency | Cost   |
|------------|---------|--------|
| PostgreSQL | 5ms     | Free   |
| MongoDB    | 8ms     | $25/mo |

Key Findings:
- **Winner**: PostgreSQL
- **Reason**: Lower latency and no cost
`;

const result = parse(markdown);

console.log(result.tables);
// [
//   [
//     { database: "PostgreSQL", latency: "5ms", cost: "Free" },
//     { database: "MongoDB", latency: "8ms", cost: "$25/mo" }
//   ]
// ]

console.log(result.keyValues);
// [{ winner: "PostgreSQL", reason: "Lower latency and no cost" }]
```

### Table Extraction: `parseTable`

Extracts a markdown table into an array of objects.

```typescript
import { parseTable } from 'md-to-data';

const table = `
| Name  | Age | Active |
|-------|-----|--------|
| Alice | 30  | Yes    |
| Bob   | 25  | No     |
| Carol | N/A | Yes    |
`;

const rows = parseTable(table);

console.log(rows);
// [
//   { name: "Alice", age: 30, active: true },
//   { name: "Bob", age: 25, active: false },
//   { name: "Carol", age: null, active: true }
// ]
```

With generics for compile-time type safety:

```typescript
interface User {
  name: string;
  age: number | null;
  active: boolean;
}

const users = parseTable<User>(table);
// users is typed as User[]
```

### List Extraction: `parseList`

Extracts lists from markdown.

```typescript
import { parseList } from 'md-to-data';

// Simple list
const items = parseList('- PostgreSQL\n- MySQL\n- SQLite');
// ["PostgreSQL", "MySQL", "SQLite"]

// Key-value list
const config = parseList(
  '- **Host**: localhost\n- **Port**: 5432\n- **SSL**: true'
);
// { host: "localhost", port: 5432, ssl: true }

// Checkbox list
const tasks = parseList(
  '- [x] Setup\n- [x] Build\n- [ ] Deploy'
);
// [
//   { text: "Setup", checked: true },
//   { text: "Build", checked: true },
//   { text: "Deploy", checked: false }
// ]
```

### Key-Value Extraction: `parseKeyValue`

Extracts key-value pairs from markdown text.

```typescript
import { parseKeyValue } from 'md-to-data';

const data = parseKeyValue(`
**Name**: Alice Johnson
**Age**: 30
**Location**: San Francisco
**Active**: Yes
`);

console.log(data);
// { name: "Alice Johnson", age: 30, location: "San Francisco", active: true }
```

### Section Extraction: `parseSections`

Extracts content organized under markdown headers into a nested object.

```typescript
import { parseSections } from 'md-to-data';

const report = parseSections(`
# Analysis Report

## Summary

The system is performing well.

## Metrics

| Metric  | Value |
|---------|-------|
| Uptime  | 99.9% |
| Latency | 12ms  |

## Action Items

- Scale database cluster
- Add monitoring alerts
`);

console.log(report);
// {
//   "Analysis Report": {
//     "Summary": "The system is performing well.",
//     "Metrics": [
//       { metric: "Uptime", value: 0.999 },
//       { metric: "Latency", value: "12ms" }
//     ],
//     "Action Items": [
//       "Scale database cluster",
//       "Add monitoring alerts"
//     ]
//   }
// }
```

### Extract All: `parseAll`

Returns all extractable structures with metadata.

```typescript
import { parseAll } from 'md-to-data';

const result = parseAll(markdown);

console.log(result.tables);     // Table[]       — all extracted tables
console.log(result.lists);      // ListResult[]   — all extracted lists
console.log(result.keyValues);  // KVResult[]     — all extracted key-value groups
console.log(result.sections);   // SectionResult  — header-based section tree
console.log(result.meta);       // ParseMeta      — extraction metadata
```

### Type Definitions

```typescript
// ── Configuration ──────────────────────────────────────────────────

/** Header normalization mode for table column keys. */
type HeaderNormalization = 'preserve' | 'camelCase' | 'snake_case' | 'kebab-case' | 'lowercase';

/** How to handle percentage values. */
type PercentageMode = 'decimal' | 'number' | 'string';

/** How to represent inferred dates. */
type DateMode = 'date' | 'iso' | 'timestamp';

/** Type inference configuration. */
interface InferenceOptions {
  /** Enable/disable all type inference. Default: true. */
  enabled?: boolean;

  /** Infer null from "N/A", "none", "-", etc. Default: true. */
  nulls?: boolean;

  /** Infer booleans from "yes"/"no", "true"/"false", etc. Default: true. */
  booleans?: boolean;

  /** Infer numbers from numeric strings. Default: true. */
  numbers?: boolean;

  /** Infer dates from ISO 8601 strings. Default: false. */
  dates?: boolean;

  /** How to represent inferred dates. Default: 'iso'. */
  dateMode?: DateMode;

  /** Infer arrays from comma-separated values. Default: false. */
  arrays?: boolean;

  /** Infer numbers from currency-prefixed strings. Default: false. */
  currency?: boolean;

  /** How to handle percentage values. Default: 'decimal'. */
  percentageMode?: PercentageMode;

  /** Custom inference functions, checked before built-in rules. */
  custom?: CustomInferenceRule[];
}

/** A custom type inference rule. */
interface CustomInferenceRule {
  /** Rule name for debugging and metadata. */
  name: string;

  /** Test whether this rule applies to the value. */
  test: (value: string) => boolean;

  /** Transform the value to the inferred type. */
  transform: (value: string) => unknown;
}

// ── Parse Options ──────────────────────────────────────────────────

/** Options shared across all parse functions. */
interface ParseOptions {
  /** Type inference configuration. Pass false to disable all inference. */
  inference?: InferenceOptions | false;

  /** Header normalization mode for table extraction. Default: 'camelCase'. */
  headerNormalization?: HeaderNormalization;

  /** Strip markdown formatting (bold, italic, code, links) from values.
   *  Default: true. */
  stripMarkdown?: boolean;

  /** Minimum confidence threshold for extractions. Default: 0.0. */
  minConfidence?: number;
}

/** Options for parseTable. */
interface ParseTableOptions extends ParseOptions {
  /** Select a specific table by zero-based index. Default: 0. */
  tableIndex?: number;

  /** Treat the table as headerless. Column keys become column1, column2, etc.
   *  Default: false (auto-detect headers). */
  headerless?: boolean;
}

/** Options for parseList. */
interface ParseListOptions extends ParseOptions {
  /** Force extraction as a specific list type rather than auto-detecting.
   *  Default: auto-detect. */
  listType?: 'simple' | 'keyValue' | 'checkbox' | 'nested';
}

/** Options for parseSections. */
interface ParseSectionOptions extends ParseOptions {
  /** Minimum header level to extract. Default: 1. */
  minLevel?: number;

  /** Maximum header level to extract. Default: 6. */
  maxLevel?: number;
}

// ── Result Types ──────────────────────────────────────────────────

/** Result of the parse() function. */
interface ParseResult {
  /** All extracted tables, each as an array of objects. */
  tables: Record<string, unknown>[][];

  /** All extracted lists. */
  lists: ListResult[];

  /** All extracted key-value groups. */
  keyValues: Record<string, unknown>[];

  /** Section tree extracted from headers. */
  sections: Record<string, unknown>;

  /** Extraction metadata. */
  meta: ParseMeta;
}

/** A single list extraction result. */
interface ListResult {
  /** The list type that was detected. */
  type: 'simple' | 'keyValue' | 'checkbox' | 'nested';

  /** The extracted data. Shape depends on type:
   *  - simple: string[] or unknown[]
   *  - keyValue: Record<string, unknown>
   *  - checkbox: CheckboxItem[]
   *  - nested: NestedItem[]
   */
  data: unknown;

  /** Confidence score for this extraction. */
  confidence: number;
}

/** A checkbox list item. */
interface CheckboxItem {
  /** The item text. */
  text: string;

  /** Whether the checkbox is checked. */
  checked: boolean;
}

/** A nested list item. */
interface NestedItem {
  /** The item's own text. */
  label: string;

  /** Child items. */
  children: (string | NestedItem)[];
}

/** Extraction metadata. */
interface ParseMeta {
  /** Number of tables found. */
  tableCount: number;

  /** Number of lists found. */
  listCount: number;

  /** Number of key-value groups found. */
  keyValueCount: number;

  /** Number of sections found. */
  sectionCount: number;

  /** Structures that were detected but fell below the confidence threshold. */
  lowConfidence: Array<{ type: string; confidence: number; line: number }>;

  /** Processing time in milliseconds. */
  durationMs: number;

  /** Per-table metadata. */
  tables: TableMeta[];
}

/** Metadata for a single extracted table. */
interface TableMeta {
  /** Zero-based index of this table in the document. */
  index: number;

  /** Raw header texts before normalization. */
  rawHeaders: string[];

  /** Normalized header keys. */
  normalizedHeaders: string[];

  /** Number of data rows. */
  rowCount: number;

  /** Column alignments detected from the separator row. */
  alignments: ('left' | 'center' | 'right')[];

  /** Whether a separator row was found. */
  hasSeparator: boolean;

  /** Confidence score for this table extraction. */
  confidence: number;

  /** Starting line number in the input. */
  startLine: number;

  /** Ending line number in the input. */
  endLine: number;
}

// ── Factory ───────────────────────────────────────────────────────

/** A configured parser instance. */
interface Parser {
  parse(markdown: string): ParseResult;
  parseTable<T = Record<string, unknown>>(markdown: string, options?: ParseTableOptions): T[];
  parseList(markdown: string, options?: ParseListOptions): unknown;
  parseKeyValue(markdown: string): Record<string, unknown>;
  parseSections(markdown: string, options?: ParseSectionOptions): Record<string, unknown>;
}
```

### Factory: `createParser`

Creates a configured parser instance with preset options, avoiding repeated option parsing across multiple calls.

```typescript
import { createParser } from 'md-to-data';

const parser = createParser({
  headerNormalization: 'snake_case',
  inference: {
    dates: true,
    dateMode: 'iso',
    arrays: true,
  },
  stripMarkdown: true,
});

const table1 = parser.parseTable(markdown1);
const table2 = parser.parseTable(markdown2);
const kv = parser.parseKeyValue(markdown3);
```

---

## 11. Schema Validation

### Problem

`parseTable()` returns `Record<string, unknown>[]`. Type inference converts strings to numbers and booleans, but the result is still loosely typed. The caller needs assurance that every row has a `name` (string), an `age` (number), and an `active` (boolean) -- and needs a compile-time TypeScript type, not just runtime hope.

### Solution: Zod Integration

`md-to-data` provides an optional integration with Zod for schema validation. The caller provides a Zod schema, and the extraction function validates each extracted record against it, leveraging Zod's coercion capabilities for type conversion guided by the schema.

```typescript
import { parseTable } from 'md-to-data';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  age: z.coerce.number(),
  active: z.coerce.boolean(),
  joinDate: z.coerce.date().optional(),
});

type User = z.infer<typeof UserSchema>;

const users = parseTable(markdown, {
  schema: UserSchema,
});
// users is typed as User[]
// Each row is validated and coerced against the schema
// Throws ZodError if validation fails
```

### Schema-Guided Coercion

When a schema is provided, the type inference layer is bypassed in favor of Zod's coercion. This has two benefits:

1. **Precision**: The schema specifies the exact expected type for each field, eliminating ambiguity. The string `"0"` is a number if the schema says `z.coerce.number()` and a boolean if the schema says `z.coerce.boolean()`.
2. **Type safety**: The return type is the schema's inferred type, not `Record<string, unknown>`.

### Error Handling

When schema validation fails:

- **`strict` mode** (default): Throws a `ZodError` with details about which fields failed validation and on which rows.
- **`partial` mode**: Returns successfully validated rows and collects validation errors in the metadata. Rows that fail validation are omitted from the result but included in `meta.validationErrors`.
- **`coerce` mode**: Attempts to coerce values to match the schema (e.g., converting `"yes"` to `true` for a boolean field). Falls back to the raw string if coercion fails.

```typescript
const result = parseTable(markdown, {
  schema: UserSchema,
  schemaMode: 'partial',
});

console.log(result.data);    // Successfully validated rows
console.log(result.errors);  // Validation errors per row
```

### Zod as Peer Dependency

Zod is an optional peer dependency. If the `schema` option is used but Zod is not installed, `md-to-data` throws a clear error: "Schema validation requires 'zod' to be installed. Run: npm install zod". When Zod is not used, it is never imported, and `md-to-data` has zero runtime dependencies.

---

## 12. Configuration

### Default Configuration

```typescript
const defaults: ParseOptions = {
  headerNormalization: 'camelCase',
  stripMarkdown: true,
  minConfidence: 0.0,
  inference: {
    enabled: true,
    nulls: true,
    booleans: true,
    numbers: true,
    dates: false,
    dateMode: 'iso',
    arrays: false,
    currency: false,
    percentageMode: 'decimal',
    custom: [],
  },
};
```

### Configuration Summary

| Option | Type | Default | Description |
|---|---|---|---|
| `headerNormalization` | `HeaderNormalization` | `'camelCase'` | How to normalize table column headers into object keys |
| `stripMarkdown` | `boolean` | `true` | Whether to strip markdown formatting (bold, italic, code, links) from extracted values |
| `minConfidence` | `number` | `0.0` | Minimum confidence threshold for including an extraction in the result |
| `inference` | `InferenceOptions \| false` | See above | Type inference configuration. Pass `false` to disable all inference |
| `inference.enabled` | `boolean` | `true` | Master switch for type inference |
| `inference.nulls` | `boolean` | `true` | Infer null from "N/A", "none", etc. |
| `inference.booleans` | `boolean` | `true` | Infer booleans from "yes"/"no", etc. |
| `inference.numbers` | `boolean` | `true` | Infer numbers from numeric strings |
| `inference.dates` | `boolean` | `false` | Infer dates from ISO 8601 strings |
| `inference.dateMode` | `DateMode` | `'iso'` | How to represent inferred dates |
| `inference.arrays` | `boolean` | `false` | Infer arrays from comma-separated values |
| `inference.currency` | `boolean` | `false` | Strip currency symbols before number inference |
| `inference.percentageMode` | `PercentageMode` | `'decimal'` | How to handle percentage values |
| `inference.custom` | `CustomInferenceRule[]` | `[]` | Custom inference rules |
| `tableIndex` | `number` | `0` | (parseTable) Select a specific table by index |
| `headerless` | `boolean` | `false` | (parseTable) Treat the table as headerless |
| `listType` | `string` | auto-detect | (parseList) Force a specific list type |
| `minLevel` | `number` | `1` | (parseSections) Minimum header level |
| `maxLevel` | `number` | `6` | (parseSections) Maximum header level |
| `schema` | `ZodSchema` | `undefined` | Optional Zod schema for validation |
| `schemaMode` | `string` | `'strict'` | Schema validation error handling mode |

---

## 13. CLI Interface

### Installation and Invocation

```bash
# Global install
npm install -g md-to-data
md-to-data < response.md

# npx (no install)
npx md-to-data < response.md

# With a file
md-to-data --file response.md
```

### CLI Binary Name

`md-to-data`

### Commands and Flags

```
md-to-data [options]

Input (reads from stdin by default):
  --file <path>             Read input from a file instead of stdin.

Extraction mode:
  --tables                  Extract only tables. Output as JSON array of arrays.
  --lists                   Extract only lists. Output as JSON.
  --key-values              Extract only key-value pairs. Output as JSON object.
  --sections                Extract only sectioned content. Output as JSON object.
  --all                     Extract everything (default). Output full ParseResult.

Table options:
  --table-index <n>         Select a specific table (zero-based). Default: all.
  --headers <mode>          Header normalization: preserve, camelCase, snake_case,
                            kebab-case, lowercase. Default: camelCase.
  --headerless              Treat tables as headerless (generate column1, column2, etc.).

Type inference:
  --no-inference            Disable all type inference. All values remain strings.
  --no-nulls                Disable null inference.
  --no-booleans             Disable boolean inference.
  --no-numbers              Disable number inference.
  --dates                   Enable date inference (disabled by default).
  --arrays                  Enable array inference (disabled by default).

Output:
  --compact                 Output compact JSON (no pretty-printing).
  --format <format>         Output format: json (default), csv, tsv.
                            csv/tsv only work with --tables.

General:
  --version                 Print version and exit.
  --help                    Print help and exit.
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success. At least one structure was extracted. |
| `1` | No extractable structures found in the input. |
| `2` | Configuration error (invalid flags, file not found, read failure). |

### Usage Examples

```bash
# Extract tables from an LLM response and pipe to jq
cat response.md | md-to-data --tables | jq '.[0]'

# Extract key-value pairs with snake_case keys
md-to-data --key-values --headers snake_case --file summary.md

# Extract everything, disable type inference
cat response.md | md-to-data --all --no-inference

# Extract first table as CSV for spreadsheet import
md-to-data --tables --table-index 0 --format csv --file report.md > report.csv

# Pipeline: normalize LLM output, then extract data
cat raw-response.txt | npx llm-output-normalizer --text | md-to-data --tables
```

### Stdin/Stdout Pipeline

Input is read from stdin (or `--file`). Structured data is output as JSON to stdout. Errors and warnings go to stderr. This enables clean piping:

```bash
# LLM call -> normalize -> extract table -> process
llm-call "compare databases" \
  | llm-output-normalizer --text \
  | md-to-data --tables \
  | jq '.[] | select(.cost == 0)'
```

---

## 14. Error Handling

### Design Principle

`md-to-data` never throws on valid input. If the input string contains no extractable structures, the functions return empty results rather than throwing. The only cases that throw are invalid arguments (null/undefined input, invalid options).

### Failure Modes

| Scenario | Behavior | Result |
|---|---|---|
| No tables found | `parseTable()` returns `[]` | Empty array |
| No lists found | `parseList()` returns `[]` | Empty array |
| No key-values found | `parseKeyValue()` returns `{}` | Empty object |
| No sections found | `parseSections()` returns `{}` | Empty object |
| `parse()` finds nothing | Returns `ParseResult` with all arrays empty | Valid empty result |
| Malformed table (inconsistent columns) | Best-effort extraction with reduced confidence | Partial data with metadata about skipped rows |
| Type inference fails on a value | Value remains a string | No data loss |
| Schema validation fails (strict mode) | Throws `ZodError` | Caller handles validation error |
| Schema validation fails (partial mode) | Returns valid rows, errors in metadata | Partial data with error details |
| Input is empty string | Returns empty result | `{ tables: [], lists: [], keyValues: [], sections: {} }` |
| Input is null or undefined | Throws `TypeError` | Only invalid-argument case that throws |

### Malformed Table Recovery

LLM output often produces imperfect tables. `md-to-data` applies best-effort recovery:

- **Missing cells**: If a row has fewer cells than headers, missing positions are filled with `null`.
- **Extra cells**: If a row has more cells than headers, extra cells are ignored and noted in metadata.
- **Inconsistent column count**: If rows have varying column counts, the header count is authoritative. Rows with a column count that differs by more than 2 from the header count are skipped and noted in metadata.
- **Missing separator row**: The table is still parsed but with reduced confidence (0.7).
- **Malformed separator**: If the separator row contains non-separator characters, it is treated as a data row and the table is parsed without a separator (confidence 0.6).

### Metadata for Debugging

Every result includes metadata sufficient for debugging extraction issues:

```typescript
const result = parse(markdown);

console.log(result.meta.tableCount);     // How many tables were found
console.log(result.meta.tables[0]);      // Detailed metadata for first table
console.log(result.meta.lowConfidence);  // Structures that fell below threshold
console.log(result.meta.durationMs);     // Processing time
```

---

## 15. Testing Strategy

### Test Fixture Design

The test suite is built around real-world LLM output fixtures. Each fixture is a markdown string paired with the expected extracted data. Fixtures are collected from actual LLM responses (GPT-4o, Claude, Gemini, Llama, Mistral) to ensure the parser handles real formatting patterns.

### Fixture Categories

**Table fixtures**:
- Standard GFM table with separator and outer pipes
- Table without outer pipes
- Table without separator row
- Table with alignment markers (left, center, right)
- Table with empty cells
- Table with nested markdown (bold, code, links)
- Table with escaped pipes
- Table with misaligned columns (varying whitespace)
- Table with numeric data (integers, floats, percentages)
- Table with boolean-like values ("Yes"/"No", "true"/"false")
- Table with null-like values ("N/A", "-", "None")
- Table with multi-word headers
- Multiple tables in one document
- Table embedded in prose (preceded and followed by paragraphs)

**List fixtures**:
- Simple unordered list (dash markers)
- Simple unordered list (asterisk markers)
- Simple unordered list (plus markers)
- Mixed markers in one list
- Ordered list (period after number)
- Ordered list (parenthesis after number)
- Key-value list with bold keys
- Key-value list with plain keys
- Nested list (two levels)
- Nested list (three levels)
- Checkbox list (all checked)
- Checkbox list (mixed)
- Multi-line list items
- List with type-inferable values

**Key-value fixtures**:
- Bold-key colon pattern
- Bold-key colon-inside pattern
- Plain colon pattern (consecutive lines)
- Definition list pattern
- Header-grouped key-values
- Multi-line values
- Values containing colons (URLs, times)
- Key-value pairs in a list

**Section fixtures**:
- Single-level headers with text bodies
- Multi-level headers (h1 containing h2 containing h3)
- Sections containing tables
- Sections containing lists
- Sections containing key-value pairs
- Mixed content under sections

**Type inference fixtures**:
- Null values: "N/A", "n/a", "None", "null", "-", "--", empty string
- Boolean values: "true", "false", "Yes", "No", "on", "off"
- Integer values: "42", "-7", "0", "1,000"
- Float values: "3.14", "-0.5", "1,234.56"
- Scientific notation: "1.5e10", "2E-3"
- Percentage values: "95%", "0.5%"
- Date values: "2024-01-15", "2024-01-15T10:30:00Z"
- Array values: "red, green, blue"
- Non-numeric strings that look numeric: phone numbers, version numbers, ZIP codes
- Strings that should not be booleans: "Notice", "Yesterday"

**Combined/edge case fixtures**:
- Empty string input
- Input with no markdown structures (pure prose)
- Input with only whitespace
- Very large table (100+ rows)
- Table with very long cell values
- Mixed content: prose + table + list + key-values
- LLM response with preamble and postamble around a table
- Table immediately followed by a list with no separator

### Test Organization

```
src/__tests__/
  parse.test.ts                -- Tests for the auto-detect parse() function
  parseTable.test.ts           -- Tests for table extraction
  parseList.test.ts            -- Tests for list extraction
  parseKeyValue.test.ts        -- Tests for key-value extraction
  parseSections.test.ts        -- Tests for section extraction
  inference.test.ts            -- Tests for type inference
  headerNormalization.test.ts  -- Tests for header normalization
  schema.test.ts               -- Tests for Zod schema validation
  cli.test.ts                  -- CLI integration tests
  fixtures/
    tables.ts                  -- Table test fixtures
    lists.ts                   -- List test fixtures
    keyValues.ts               -- Key-value test fixtures
    sections.ts                -- Section test fixtures
    combined.ts                -- Combined/mixed content fixtures
    llmOutputs.ts              -- Real LLM output fixtures
    edgeCases.ts               -- Edge case fixtures
```

### Test Runner

`vitest` (configured in `package.json`).

---

## 16. Performance

### Design Constraints

`md-to-data` processes markdown strings that are typically 100 bytes to 100 KB -- the range of LLM responses. Processing should be imperceptible: under 1ms for typical input, under 10ms for large input. A typical LLM API call takes 1-30 seconds; the extraction step should add no perceptible latency.

### Optimization Strategy

**Single-pass line scanning**: The detection phase scans the input line by line, classifying each line as a table row, list item, key-value pair, header, or prose. This classification is a single pass. Each recognized structure is then parsed in a targeted second pass over just the relevant lines.

**No intermediate AST**: Unlike general-purpose markdown parsers (`remark`, `marked`, `markdown-it`) that build a full abstract syntax tree, `md-to-data` does not construct an AST. It identifies data-carrying structures directly from the line classifications and parses them into output objects. This avoids the memory overhead and processing time of full AST construction.

**Regex pre-compilation**: All regular expressions are compiled once at module load time and reused across calls. There is no regex compilation cost per function call.

**Early termination for targeted functions**: `parseTable()` stops scanning after finding the requested table. `parseList()` stops after finding the first list (unless in `parseAll` mode). This avoids processing the entire document when only one structure is needed.

**Type inference short-circuits**: The inference pipeline checks rules in priority order and returns on the first match. Null detection (a simple set lookup) is first. Boolean detection (a small set lookup) is second. Number detection (a regex test) is third. Most values are resolved in microseconds.

### Benchmarks

Target performance on typical inputs (measured on a 2024 MacBook Pro, Node.js 22):

| Input Size | Content | Expected Time |
|---|---|---|
| 200 bytes | Simple 3-column, 3-row table | < 0.05ms |
| 1 KB | Table with 10 rows + key-value list | < 0.1ms |
| 5 KB | Multiple tables, lists, and key-values | < 0.3ms |
| 50 KB | Large table with 500 rows | < 3ms |
| 100 KB | Very large mixed content | < 10ms |

---

## 17. Dependencies

### Runtime Dependencies

None. `md-to-data` has zero runtime dependencies. All functionality -- line scanning, regex pattern matching, type inference, header normalization -- is implemented using Node.js built-in APIs and hand-written code.

### Optional Peer Dependencies

| Dependency | Purpose | When Needed |
|---|---|---|
| `zod` (>=3.0.0) | Schema validation and type coercion | When the `schema` option is used |

### Development Dependencies

| Package | Purpose |
|---|---|
| `typescript` | TypeScript compiler |
| `vitest` | Test runner |
| `eslint` | Linting |
| `@types/node` | Node.js type definitions |

### Why Zero Dependencies

The package performs line-by-line text scanning and regex matching on markdown strings. These operations are straightforward to implement with Node.js built-ins and do not benefit from external libraries. Zero dependencies eliminate supply chain risk, keep installed size minimal, and ensure compatibility across Node.js 18+ environments. The optional Zod peer dependency is only imported when the caller explicitly provides a schema, maintaining zero-dependency operation for the common case.

---

## 18. File Structure

```
md-to-data/
  package.json
  tsconfig.json
  SPEC.md
  README.md
  src/
    index.ts                       -- Public API exports
    parse.ts                       -- parse() function (auto-detect and extract all)
    parseTable.ts                  -- parseTable() function
    parseList.ts                   -- parseList() function
    parseKeyValue.ts               -- parseKeyValue() function
    parseSections.ts               -- parseSections() function
    factory.ts                     -- createParser() factory function
    types.ts                       -- All TypeScript type definitions
    cli.ts                         -- CLI entry point
    detection/
      index.ts                     -- Structure detection orchestrator
      table-detector.ts            -- Detect table boundaries in line-classified input
      list-detector.ts             -- Detect list boundaries
      kv-detector.ts               -- Detect key-value pair groups
      section-detector.ts          -- Detect header-delimited sections
    extraction/
      table-extractor.ts           -- Parse detected table lines into objects
      list-extractor.ts            -- Parse detected list lines into arrays/objects
      kv-extractor.ts              -- Parse detected key-value lines into objects
      section-extractor.ts         -- Parse detected sections into nested objects
    inference/
      index.ts                     -- Type inference pipeline
      null.ts                      -- Null detection rules
      boolean.ts                   -- Boolean detection rules
      number.ts                    -- Number detection and parsing
      date.ts                      -- Date detection and parsing
      array.ts                     -- Array detection (comma-separated splitting)
    normalization/
      headers.ts                   -- Header text normalization (camelCase, snake_case, etc.)
      markdown-strip.ts            -- Strip inline markdown formatting from values
    schema/
      index.ts                     -- Zod integration (lazy-loaded)
    utils/
      lines.ts                     -- Line splitting, classification, indentation detection
      patterns.ts                  -- Shared regex patterns
  src/__tests__/
    parse.test.ts
    parseTable.test.ts
    parseList.test.ts
    parseKeyValue.test.ts
    parseSections.test.ts
    inference.test.ts
    headerNormalization.test.ts
    schema.test.ts
    cli.test.ts
    fixtures/
      tables.ts
      lists.ts
      keyValues.ts
      sections.ts
      combined.ts
      llmOutputs.ts
      edgeCases.ts
  dist/                            -- Compiled output (generated by tsc)
```

---

## 19. Implementation Roadmap

### Phase 1: Core Extraction (v0.1.0)

Implement table and list extraction with type inference -- the two most common structures in LLM output.

**Deliverables:**
1. TypeScript type definitions (`types.ts`).
2. Line utility functions: splitting, classification, indentation detection.
3. Header normalization: camelCase, snake_case, kebab-case, lowercase, preserve.
4. Markdown stripping: remove bold, italic, code, link formatting from values.
5. Type inference pipeline: null, boolean, number detection with full configuration.
6. Table detection: identify table boundaries, separator rows, column counts.
7. Table extraction: parse rows into objects with normalized headers and type-inferred values.
8. List detection: identify unordered, ordered, and checkbox lists.
9. List extraction: simple lists to arrays, key-value lists to objects, checkbox lists to `{ text, checked }[]`.
10. `parseTable()` and `parseList()` public API functions.
11. `parse()` auto-detect function (tables and lists only in this phase).
12. Unit tests for all extraction, inference, and normalization logic.
13. Test fixtures from real LLM output.

### Phase 2: Key-Value and Section Extraction (v0.2.0)

Add key-value pair extraction, section extraction, and nested list support.

**Deliverables:**
1. Key-value detection: bold-key patterns, plain colon patterns, definition lists.
2. Key-value extraction: parse detected pairs into objects with type inference.
3. Header-grouped key-values: nest key-value pairs under header keys.
4. Section detection: identify header-delimited sections.
5. Section extraction: recursive parsing of section bodies (tables, lists, key-values, prose).
6. Nested list extraction: indentation-based nesting into tree structures.
7. `parseKeyValue()` and `parseSections()` public API functions.
8. `parseAll()` function returning all structures.
9. `parse()` updated to include key-values and sections.
10. Confidence scoring for all extraction types.
11. Full test coverage for new functionality.

### Phase 3: Schema Validation and CLI (v0.3.0)

Add Zod integration and the CLI interface.

**Deliverables:**
1. Zod schema integration: validation, coercion, error reporting.
2. Schema modes: strict, partial, coerce.
3. `createParser()` factory function.
4. CLI implementation: stdin reading, flag parsing, JSON output, exit codes.
5. CLI integration tests.
6. Date inference (opt-in).
7. Array inference (opt-in).
8. Currency inference (opt-in).
9. Custom inference rules API.
10. Full test coverage for schema validation and CLI.

### Phase 4: Polish and 1.0 (v1.0.0)

Production readiness.

**Deliverables:**
1. Performance optimization: benchmark suite, hot path optimization.
2. Edge case hardening: malformed tables, ambiguous structures, very large inputs.
3. LLM-specific quirk tolerance: expanded test fixtures from real model outputs.
4. CSV/TSV output format for CLI.
5. API stability guarantee (semver major version).
6. Comprehensive README with usage examples.

---

## 20. Example Use Cases

### 20.1 Table Extraction: LLM Product Comparison

**LLM output** (response to "Compare these three databases"):

```markdown
Here's a comparison of the three databases:

| Feature      | PostgreSQL | MongoDB   | SQLite    |
|-------------|-----------|-----------|-----------|
| Type         | SQL       | NoSQL     | SQL       |
| License      | MIT       | SSPL      | Public Domain |
| Max DB Size  | Unlimited | Unlimited | 281 TB    |
| ACID         | Yes       | Yes       | Yes       |
| Cost         | Free      | Free      | Free      |
| Popularity   | #1        | #5        | #3        |

Let me know if you want more details on any of these!
```

**After `parseTable(output)`**:

```json
[
  { "feature": "Type", "postgreSql": "SQL", "mongoDb": "NoSQL", "sqLite": "SQL" },
  { "feature": "License", "postgreSql": "MIT", "mongoDb": "SSPL", "sqLite": "Public Domain" },
  { "feature": "Max DB Size", "postgreSql": "Unlimited", "mongoDb": "Unlimited", "sqLite": "281 TB" },
  { "feature": "ACID", "postgreSql": true, "mongoDb": true, "sqLite": true },
  { "feature": "Cost", "postgreSql": "Free", "mongoDb": "Free", "sqLite": "Free" },
  { "feature": "Popularity", "postgreSql": "#1", "mongoDb": "#5", "sqLite": "#3" }
]
```

Note: "Yes" is inferred as `true`. Headers are camelCased. The preamble and postamble are ignored because they are not part of the table structure.

---

### 20.2 Key-Value List: LLM Entity Extraction

**LLM output** (response to "Extract the key details from this resume"):

```markdown
- **Name**: Sarah Chen
- **Title**: Senior Software Engineer
- **Experience**: 8 years
- **Location**: San Francisco, CA
- **Skills**: Python, Go, Kubernetes, AWS
- **Available**: Yes
- **Salary Expectation**: $180,000
```

**After `parseList(output, { inference: { arrays: true, currency: true } })`**:

```json
{
  "name": "Sarah Chen",
  "title": "Senior Software Engineer",
  "experience": 8,
  "location": "San Francisco, CA",
  "skills": ["Python", "Go", "Kubernetes", "AWS"],
  "available": true,
  "salaryExpectation": 180000
}
```

Note: "8 years" is inferred as the number 8 (the word "years" follows a number pattern). Skills are split into an array with `inferArrays: true`. Currency symbol is stripped with `inferCurrency: true`. "Yes" becomes `true`.

---

### 20.3 Checkbox List: LLM Task Status

**LLM output** (response to "What's the status of the migration?"):

```markdown
Here's the current status:

- [x] Schema migration complete
- [x] Data migration for users table
- [x] Data migration for orders table
- [ ] Index rebuilding
- [ ] Performance validation
- [ ] Production cutover
```

**After `parseList(output)`**:

```json
[
  { "text": "Schema migration complete", "checked": true },
  { "text": "Data migration for users table", "checked": true },
  { "text": "Data migration for orders table", "checked": true },
  { "text": "Index rebuilding", "checked": false },
  { "text": "Performance validation", "checked": false },
  { "text": "Production cutover", "checked": false }
]
```

---

### 20.4 Sectioned Content: LLM Analysis Report

**LLM output** (response to "Analyze our system architecture"):

```markdown
## Overview

The system uses a microservices architecture with 12 services.

## Performance Metrics

| Metric       | Current | Target  |
|-------------|---------|---------|
| Latency (p99)| 250ms  | 100ms   |
| Throughput   | 5,000 rps | 10,000 rps |
| Error Rate   | 0.5%   | 0.1%    |

## Recommendations

1. Add connection pooling to reduce database latency
2. Implement caching layer for frequently accessed data
3. Split the monolithic auth service into separate services

## Risk Assessment

- **High**: Database connection exhaustion under peak load
- **Medium**: Cache invalidation complexity
- **Low**: Service mesh migration timeline
```

**After `parseSections(output)`**:

```json
{
  "Overview": "The system uses a microservices architecture with 12 services.",
  "Performance Metrics": [
    { "metric": "Latency (p99)", "current": "250ms", "target": "100ms" },
    { "metric": "Throughput", "current": 5000, "target": 10000 },
    { "metric": "Error Rate", "current": 0.005, "target": 0.001 }
  ],
  "Recommendations": [
    "Add connection pooling to reduce database latency",
    "Implement caching layer for frequently accessed data",
    "Split the monolithic auth service into separate services"
  ],
  "Risk Assessment": {
    "high": "Database connection exhaustion under peak load",
    "medium": "Cache invalidation complexity",
    "low": "Service mesh migration timeline"
  }
}
```

Note: Each section body is recursively parsed. The "Performance Metrics" section contains a table, which is extracted as an array of objects. "Recommendations" contains a numbered list, extracted as a string array. "Risk Assessment" contains key-value list items, extracted as an object. Percentages are converted to decimals. Comma-separated numbers are parsed.

---

### 20.5 Mixed Content with Schema Validation

**LLM output** (response to "List the top 5 stocks to watch"):

```markdown
| Ticker | Company          | Price   | Change | Rating |
|--------|-----------------|---------|--------|--------|
| AAPL   | Apple Inc.       | $192.50 | +2.3%  | Buy    |
| MSFT   | Microsoft Corp.  | $415.20 | +1.1%  | Buy    |
| GOOGL  | Alphabet Inc.    | $155.80 | -0.5%  | Hold   |
| AMZN   | Amazon.com Inc.  | $185.60 | +3.2%  | Buy    |
| NVDA   | NVIDIA Corp.     | $875.30 | +5.1%  | Buy    |
```

**With Zod schema**:

```typescript
import { parseTable } from 'md-to-data';
import { z } from 'zod';

const StockSchema = z.object({
  ticker: z.string(),
  company: z.string(),
  price: z.coerce.number(),
  change: z.string(),
  rating: z.enum(['Buy', 'Hold', 'Sell']),
});

const stocks = parseTable(output, {
  schema: StockSchema,
  inference: { currency: true },
});

// stocks is typed as { ticker: string, company: string, price: number, change: string, rating: 'Buy' | 'Hold' | 'Sell' }[]
```

---

### 20.6 Pipeline Composition with llm-output-normalizer

```typescript
import { normalize } from 'llm-output-normalizer';
import { parseTable } from 'md-to-data';

// Raw LLM output with preamble, thinking block, and postamble
const raw = `
<thinking>
The user wants a comparison table. Let me format it nicely.
</thinking>

Sure! Here's the comparison you requested:

| Feature | Option A | Option B |
|---------|----------|----------|
| Price   | $10/mo   | $25/mo   |
| Storage | 100 GB   | 500 GB   |
| Support | Email    | 24/7     |

Let me know if you need more details!
`;

// Step 1: Normalize -- strip thinking block, preamble, postamble
const cleaned = normalize(raw, { mode: 'text' });

// Step 2: Extract table from cleaned markdown
const comparison = parseTable(cleaned.text);

console.log(comparison);
// [
//   { feature: "Price", optionA: "$10/mo", optionB: "$25/mo" },
//   { feature: "Storage", optionA: "100 GB", optionB: "500 GB" },
//   { feature: "Support", optionA: "Email", optionB: "24/7" }
// ]
```
