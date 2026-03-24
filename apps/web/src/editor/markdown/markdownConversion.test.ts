import { describe, expect, it } from 'vitest'
import { createFolioEditorExtensions } from '../core/extensions'
import { docToMarkdown, markdownToDoc } from './markdownConversion'

describe('markdownConversion', () => {
  it('imports legacy markdown into a rich doc and preserves the main Folio blocks on export', () => {
    const source = `# Title

- [x] Ship migration

> [!tip] Keep this in mind
> Callouts should round-trip.

\`\`\`js
console.log("aura")
\`\`\`

| Name | Value |
| --- | --- |
| Aura | Notes |`

    const doc = markdownToDoc(source, createFolioEditorExtensions())
    const markdown = docToMarkdown(doc)

    expect(doc.type).toBe('doc')
    expect(doc.content!.some((node) => node.type === 'heading')).toBe(true)
    expect(doc.content!.some((node) => node.type === 'taskList')).toBe(true)
    expect(doc.content!.some((node) => node.type === 'callout')).toBe(true)
    expect(doc.content!.some((node) => node.type === 'codeBlock')).toBe(true)
    expect(doc.content!.some((node) => node.type === 'table')).toBe(true)

    expect(markdown).toContain('# Title')
    expect(markdown).toContain('- [x] Ship migration')
    expect(markdown).toContain('> [!tip] Keep this in mind')
    expect(markdown).toContain('```js')
    expect(markdown).toContain('| Name | Value |')
  })
})
