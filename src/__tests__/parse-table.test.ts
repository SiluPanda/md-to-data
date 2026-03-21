import { describe, it, expect } from 'vitest'
import { parseTable } from '../parse-table.js'

const SIMPLE_TABLE = `
| Name | Age | Active |
|------|-----|--------|
| Alice | 30 | true |
| Bob | 25 | false |
`

const MULTI_TABLE = `
| City | Country |
|------|---------|
| London | UK |
| Paris | France |

| Product | Price |
|---------|-------|
| Widget | 9.99 |
| Gadget | 19.99 |
`

describe('parseTable', () => {
  it('parses a standard markdown table into row objects', () => {
    const rows = parseTable(SIMPLE_TABLE)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ name: 'Alice', age: 30, active: true })
    expect(rows[1]).toMatchObject({ name: 'Bob', age: 25, active: false })
  })

  it('applies camelCase header normalization by default', () => {
    const md = `
| First Name | Last Name |
|-----------|-----------|
| John | Doe |
`
    const rows = parseTable(md)
    expect(rows[0]).toHaveProperty('firstName', 'John')
    expect(rows[0]).toHaveProperty('lastName', 'Doe')
  })

  it('applies snake_case header normalization', () => {
    const md = `
| First Name | Last Name |
|-----------|-----------|
| John | Doe |
`
    const rows = parseTable(md, { headerNormalization: 'snake_case' })
    expect(rows[0]).toHaveProperty('first_name', 'John')
    expect(rows[0]).toHaveProperty('last_name', 'Doe')
  })

  it('applies kebab-case header normalization', () => {
    const md = `
| First Name | Last Name |
|-----------|-----------|
| John | Doe |
`
    const rows = parseTable(md, { headerNormalization: 'kebab-case' })
    expect(rows[0]).toHaveProperty('first-name', 'John')
  })

  it('infers numbers from string cells', () => {
    const rows = parseTable(SIMPLE_TABLE)
    expect(typeof rows[0]['age']).toBe('number')
    expect(rows[0]['age']).toBe(30)
  })

  it('infers booleans from string cells', () => {
    const rows = parseTable(SIMPLE_TABLE)
    expect(rows[0]['active']).toBe(true)
    expect(rows[1]['active']).toBe(false)
  })

  it('infers null from empty cells', () => {
    const md = `
| Name | Score |
|------|-------|
| Alice | |
| Bob | null |
| Carol | n/a |
`
    const rows = parseTable(md)
    expect(rows[0]['score']).toBeNull()
    expect(rows[1]['score']).toBeNull()
    expect(rows[2]['score']).toBeNull()
  })

  it('disables inference when inference.enabled=false', () => {
    const rows = parseTable(SIMPLE_TABLE, { inference: { enabled: false } })
    expect(typeof rows[0]['age']).toBe('string')
    expect(rows[0]['age']).toBe('30')
  })

  it('parses second table when tableIndex=1', () => {
    const rows = parseTable(MULTI_TABLE, { tableIndex: 1 })
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ product: 'Widget', price: 9.99 })
    expect(rows[1]).toMatchObject({ product: 'Gadget', price: 19.99 })
  })

  it('returns empty array for missing table index', () => {
    const rows = parseTable(SIMPLE_TABLE, { tableIndex: 5 })
    expect(rows).toEqual([])
  })

  it('returns empty array when no table is present', () => {
    const rows = parseTable('No table here')
    expect(rows).toEqual([])
  })
})
