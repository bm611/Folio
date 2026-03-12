import { describe, expect, it } from 'vitest'

import {
  countMarkdownWords,
  formatReadTimeFromWordCount,
  getMarkdownExcerpt,
  markdownToPlainText,
} from './markdownText'

describe('markdownText utilities', () => {
  it('converts markdown into readable plain text', () => {
    const plainText = markdownToPlainText('# Title\n\n- [x] Ship **feature** with `code`')

    expect(plainText).toBe('Title [x] Ship feature with code')
  })

  it('counts markdown words and formats read time consistently', () => {
    const markdown = 'One two three four five six seven eight nine ten'

    expect(countMarkdownWords(markdown)).toBe(10)
    expect(formatReadTimeFromWordCount(10)).toBe('<1 min read')
    expect(formatReadTimeFromWordCount(400)).toBe('~2 min read')
  })

  it('returns a query-centered excerpt or a fallback when content is empty', () => {
    const excerpt = getMarkdownExcerpt(
      'Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda',
      'theta'
    )

    expect(excerpt.toLowerCase()).toContain('theta')
    expect(getMarkdownExcerpt('', 'anything')).toBe('No content yet.')
  })
})
