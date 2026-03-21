import { describe, it, expect } from 'vitest'
import { parseList } from '../parse-list.js'
import type { CheckboxItem } from '../types.js'

describe('parseList', () => {
  it('parses an unordered list', () => {
    const md = `
- Apple
- Banana
- Cherry
`
    const items = parseList(md)
    expect(items).toEqual(['Apple', 'Banana', 'Cherry'])
  })

  it('parses an ordered list', () => {
    const md = `
1. First
2. Second
3. Third
`
    const items = parseList(md)
    expect(items).toEqual(['First', 'Second', 'Third'])
  })

  it('parses a checkbox list with unchecked items', () => {
    const md = `
- [ ] Buy milk
- [ ] Write tests
`
    const items = parseList(md) as CheckboxItem[]
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ text: 'Buy milk', checked: false })
    expect(items[1]).toMatchObject({ text: 'Write tests', checked: false })
  })

  it('parses a checkbox list with checked items', () => {
    const md = `
- [x] Deploy to prod
- [X] Update docs
`
    const items = parseList(md) as CheckboxItem[]
    expect(items[0]).toMatchObject({ text: 'Deploy to prod', checked: true })
    expect(items[1]).toMatchObject({ text: 'Update docs', checked: true })
  })

  it('parses mixed checked and unchecked checkboxes', () => {
    const md = `
- [x] Done
- [ ] Pending
`
    const items = parseList(md) as CheckboxItem[]
    expect(items[0].checked).toBe(true)
    expect(items[1].checked).toBe(false)
  })

  it('parses list with * and + bullet styles', () => {
    const md = `
* Alpha
+ Beta
`
    const items = parseList(md)
    expect(items).toEqual(['Alpha', 'Beta'])
  })

  it('strips markdown from list item text', () => {
    const md = `
- **Bold item**
- *italic item*
- \`code item\`
`
    const items = parseList(md)
    expect(items).toEqual(['Bold item', 'italic item', 'code item'])
  })

  it('returns empty array for non-list markdown', () => {
    const items = parseList('Just some text\nNo list here')
    expect(items).toEqual([])
  })
})
