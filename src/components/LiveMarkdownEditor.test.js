import { describe, expect, it } from 'vitest'

import { __TEST_ONLY__ } from './LiveMarkdownEditor'

function makeBlocks(rawList) {
  return rawList.map((raw, index) => ({ id: `b-${index}`, raw }))
}

describe('LiveMarkdownEditor cross-block deletion', () => {
  it('replaces a selected block range with the first block when deleting', () => {
    const blocks = makeBlocks(['Alpha one', 'Beta two', 'Gamma'])
    const result = __TEST_ONLY__.replaceBlocksWithSingle(blocks, { start: 0, end: 1 }, 'Alpha one')

    expect(result.nextBlocks.map((block) => block.raw)).toEqual(['Alpha one', 'Gamma'])
    expect(result.focusIndex).toBe(0)
    expect(result.caret).toBe('Alpha one'.length)
  })

  it('replaces selected blocks with typed character', () => {
    const blocks = makeBlocks(['First', 'Second', 'Third'])
    const result = __TEST_ONLY__.replaceBlocksWithSingle(blocks, { start: 0, end: 2 }, 'x')

    expect(result.nextBlocks.map((block) => block.raw)).toEqual(['x'])
    expect(result.focusIndex).toBe(0)
    expect(result.caret).toBe(1)
  })

  it('keeps legacy block-range deletion behavior for shift-range selection', () => {
    const blocks = makeBlocks(['A', 'B', 'C', 'D'])
    const result = __TEST_ONLY__.deleteBlocksByRange(blocks, { start: 1, end: 2 })

    expect(result.nextBlocks.map((block) => block.raw)).toEqual(['A', 'D'])
    expect(result.focusIndex).toBe(1)
    expect(result.caret).toBe(0)
  })
})
