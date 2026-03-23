import { describe, it, expect } from 'vitest'
import { createParser } from '../create-parser.js'

const TABLE_MD = `
| Name | Age | Active |
|------|-----|--------|
| Alice | 30 | true |
`

describe('createParser', () => {
  it('applies default table options', () => {
    const parser = createParser({
      tableOptions: { headerNormalization: 'snake_case' },
    })
    const rows = parser.parseTable(TABLE_MD)
    expect(rows[0]).toHaveProperty('active', true)
    expect(rows[0]).not.toHaveProperty('Active')
  })

  it('deep-merges inference options instead of shallow overwrite', () => {
    const parser = createParser({
      tableOptions: { inference: { numbers: false } },
    })
    // Call with partial inference override — should merge, not replace
    const rows = parser.parseTable(TABLE_MD, { inference: { booleans: false } })
    // numbers: false from defaults should be preserved
    expect(typeof rows[0]['age']).toBe('string')
    expect(rows[0]['age']).toBe('30')
    // booleans: false from call-site should also apply
    expect(typeof rows[0]['active']).toBe('string')
    expect(rows[0]['active']).toBe('true')
  })

  it('uses call-site options when no defaults set', () => {
    const parser = createParser()
    const rows = parser.parseTable(TABLE_MD, { inference: { enabled: false } })
    expect(typeof rows[0]['age']).toBe('string')
  })

  it('uses defaults when no call-site options provided', () => {
    const parser = createParser({
      tableOptions: { inference: { numbers: false } },
    })
    const rows = parser.parseTable(TABLE_MD)
    expect(typeof rows[0]['age']).toBe('string')
    expect(rows[0]['active']).toBe(true) // booleans still inferred
  })

  it('deep-merges inference for parseList', () => {
    const parser = createParser({
      listOptions: { inference: { numbers: false } },
    })
    const items = parser.parseList('- 42\n- true', { inference: { booleans: false } })
    // numbers: false → "42" stays string
    expect(items[0]).toBe('42')
    // booleans: false → "true" stays string
    expect(items[1]).toBe('true')
  })

  it('deep-merges inference for parseKeyValue', () => {
    const parser = createParser({
      keyValueOptions: { inference: { numbers: false } },
    })
    const result = parser.parseKeyValue('score: 99\nactive: true', {
      inference: { booleans: false },
    })
    expect(typeof result['score']).toBe('string')
    expect(typeof result['active']).toBe('string')
  })

  it('parse() returns aggregate results', () => {
    const parser = createParser()
    const result = parser.parse('# Heading\nSome content.\n\n- item1\n- item2')
    expect(result.sections).toHaveProperty('Heading')
    expect(result.lists).toHaveLength(1)
  })
})
