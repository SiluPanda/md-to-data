import { describe, it, expect } from 'vitest'
import { parseSections } from '../parse-sections.js'

describe('parseSections', () => {
  it('splits markdown on h1 headings', () => {
    const md = `# Introduction
This is the intro.

# Conclusion
This is the end.
`
    const sections = parseSections(md)
    expect(sections).toHaveProperty('Introduction')
    expect(sections).toHaveProperty('Conclusion')
    expect(sections['Introduction']).toContain('This is the intro.')
    expect(sections['Conclusion']).toContain('This is the end.')
  })

  it('handles h2 and h3 headings', () => {
    const md = `## Setup
Install dependencies.

### Usage
Run the command.
`
    const sections = parseSections(md)
    expect(sections).toHaveProperty('Setup')
    expect(sections).toHaveProperty('Usage')
  })

  it('captures content between headings correctly', () => {
    const md = `# Alpha
Line 1
Line 2

# Beta
Line 3
`
    const sections = parseSections(md)
    expect(sections['Alpha']).toBe('Line 1\nLine 2')
    expect(sections['Beta']).toBe('Line 3')
  })

  it('filters by minLevel', () => {
    const md = `# Top Level
Content A

## Sub Level
Content B
`
    const sections = parseSections(md, { minLevel: 2 })
    expect(sections).not.toHaveProperty('Top Level')
    expect(sections).toHaveProperty('Sub Level')
  })

  it('filters by maxLevel', () => {
    const md = `# Top
Content A

## Sub
Content B

### Deep
Content C
`
    const sections = parseSections(md, { maxLevel: 2 })
    expect(sections).toHaveProperty('Top')
    expect(sections).toHaveProperty('Sub')
    expect(sections).not.toHaveProperty('Deep')
  })

  it('strips markdown from heading text', () => {
    const md = `## **Bold Heading**
content
`
    const sections = parseSections(md)
    expect(sections).toHaveProperty('Bold Heading')
  })

  it('returns empty object for markdown with no headings', () => {
    const sections = parseSections('Just a paragraph.\nNo headings here.')
    expect(Object.keys(sections)).toHaveLength(0)
  })
})
