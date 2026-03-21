import { describe, it, expect } from 'vitest'
import { parseKeyValue } from '../parse-key-value.js'

describe('parseKeyValue', () => {
  it('parses simple colon-delimited key-value pairs', () => {
    const md = `
name: Alice
age: 30
city: London
`
    const result = parseKeyValue(md)
    expect(result).toMatchObject({ name: 'Alice', age: 30, city: 'London' })
  })

  it('parses equals-delimited key-value pairs', () => {
    const md = `
host = localhost
port = 5432
`
    const result = parseKeyValue(md)
    expect(result).toMatchObject({ host: 'localhost', port: 5432 })
  })

  it('applies camelCase normalization to keys by default', () => {
    const md = `
first name: John
last name: Doe
`
    const result = parseKeyValue(md)
    expect(result).toHaveProperty('firstName', 'John')
    expect(result).toHaveProperty('lastName', 'Doe')
  })

  it('applies snake_case normalization to keys', () => {
    const md = `
first name: John
`
    const result = parseKeyValue(md, { headerNormalization: 'snake_case' })
    expect(result).toHaveProperty('first_name', 'John')
  })

  it('infers number values', () => {
    const md = `score: 99`
    const result = parseKeyValue(md)
    expect(result['score']).toBe(99)
  })

  it('infers boolean values', () => {
    const md = `
active: true
disabled: false
`
    const result = parseKeyValue(md)
    expect(result['active']).toBe(true)
    expect(result['disabled']).toBe(false)
  })

  it('infers null for empty values', () => {
    const md = `
optional:
missing: null
blank: n/a
`
    const result = parseKeyValue(md)
    expect(result['optional']).toBeNull()
    expect(result['missing']).toBeNull()
    expect(result['blank']).toBeNull()
  })

  it('parses bold-key style', () => {
    const md = `**name**: Alice`
    const result = parseKeyValue(md)
    expect(result['name']).toBe('Alice')
  })

  it('skips heading lines', () => {
    const md = `
## Configuration
host: localhost
`
    const result = parseKeyValue(md)
    expect(result).not.toHaveProperty('##configuration')
    expect(result['host']).toBe('localhost')
  })

  it('skips table rows', () => {
    const md = `
| col1 | col2 |
|------|------|
| a | b |
`
    const result = parseKeyValue(md)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('supports custom delimiters', () => {
    const md = `key -> value`
    const result = parseKeyValue(md, { delimiters: ['->'] })
    expect(result['key']).toBe('value')
  })
})
