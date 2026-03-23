import { describe, expect, it } from 'vitest'

import type { TreeNode } from '../types'
import {
  collectSubtreeIds,
  deleteNode,
  filterTreeNodes,
  flattenNodes,
  flattenTree,
  getVisibleFiles,
  insertNode,
  moveNode,
  renameNode,
  rebuildTreeFromFlat,
  updateFileNode,
} from './tree'

const baseTree = [
  {
    id: 'folder-a',
    type: 'folder',
    name: 'Projects',
    children: [
      {
        id: 'file-a',
        type: 'file',
        name: 'Alpha',
        title: 'Alpha',
        content: 'one',
      },
    ],
  },
  {
    id: 'file-b',
    type: 'file',
    name: 'Inbox',
    title: 'Inbox',
    content: 'two',
  },
] as unknown as TreeNode[]

describe('tree utilities', () => {
  it('inserts nodes at the requested location', () => {
    const nextTree = insertNode(baseTree, 'folder-a', {
      id: 'file-c',
      type: 'file',
      name: 'Beta',
      title: 'Beta',
      content: 'three',
    } as unknown as TreeNode)

    expect((nextTree[0] as any).children).toHaveLength(2)
    expect(flattenTree(nextTree).map((node) => node.id)).toEqual(['file-a', 'file-c', 'file-b'])
  })

  it('renames and updates file nodes without mutating siblings', () => {
    const renamedTree = renameNode(baseTree, 'file-b', 'Updated Inbox')
    const updatedTree = updateFileNode(renamedTree, 'file-a', { content: 'updated' })

    expect(updatedTree[1]).toMatchObject({ name: 'Updated Inbox', title: 'Updated Inbox' })
    expect((updatedTree[0] as any).children[0].content).toBe('updated')
  })

  it('deletes nested nodes and only returns visible files from expanded folders', () => {
    const nextTree = deleteNode(baseTree, 'file-a')

    expect(flattenTree(nextTree).map((node) => node.id)).toEqual(['file-b'])
    expect(getVisibleFiles(baseTree, new Set(['folder-a'])).map((node) => node.id)).toEqual([
      'file-a',
      'file-b',
    ])
  })

  it('filters tree results and keeps folders sorted before files', () => {
    const mixedTree = [
      { id: 'file-z', type: 'file', name: 'Zoo', title: 'Zoo', content: '' },
      {
        id: 'folder-b',
        type: 'folder',
        name: 'Archive',
        children: [{ id: 'file-c', type: 'file', name: 'Receipt', title: 'Receipt', content: '' }],
      },
    ] as unknown as TreeNode[]

    const filteredTree = filterTreeNodes(mixedTree, 'rece')

    expect(filteredTree[0]).toMatchObject({ id: 'folder-b' })
    expect((filteredTree[0] as any).children[0]).toMatchObject({ id: 'file-c' })
  })

  it('flattens full node trees with parent ids and rebuilds the same structure', () => {
    const flattened = flattenNodes(baseTree)

    expect(flattened).toEqual([
      { id: 'folder-a', type: 'folder', name: 'Projects', parentId: null },
      { id: 'file-a', type: 'file', name: 'Alpha', title: 'Alpha', content: 'one', parentId: 'folder-a' },
      { id: 'file-b', type: 'file', name: 'Inbox', title: 'Inbox', content: 'two', parentId: null },
    ])

    expect(rebuildTreeFromFlat(flattened)).toEqual(baseTree)
  })

  it('collects ids for folders and all descendants', () => {
    expect(collectSubtreeIds(baseTree, 'folder-a')).toEqual(['folder-a', 'file-a'])
    expect(collectSubtreeIds(baseTree, 'file-b')).toEqual(['file-b'])
    expect(collectSubtreeIds(baseTree, 'missing')).toEqual([])
  })

  it('moves a file to a different folder', () => {
    const nextTree = moveNode(baseTree, 'file-b', 'folder-a')

    expect(nextTree[0]).toMatchObject({ id: 'folder-a' })
    const folderChildren = (nextTree[0] as { children: TreeNode[] }).children
    expect(folderChildren).toHaveLength(2)
    expect(flattenTree(nextTree).map((n) => n.id)).toEqual(['file-a', 'file-b'])
  })

  it('moves a file to root', () => {
    const nestedTree = [
      {
        id: 'folder-x',
        type: 'folder',
        name: 'Nested',
        children: [
          { id: 'file-y', type: 'file', name: 'Deep', title: 'Deep', content: '' },
        ],
      },
    ] as unknown as TreeNode[]

    const nextTree = moveNode(nestedTree, 'file-y', null)

    expect(nextTree).toHaveLength(2)
    expect(nextTree[1]).toMatchObject({ id: 'file-y', name: 'Deep' })
  })

  it('prevents moving a folder into its own descendant', () => {
    const treeWithSubfolder = [
      {
        id: 'parent',
        type: 'folder',
        name: 'Parent',
        children: [
          {
            id: 'child',
            type: 'folder',
            name: 'Child',
            children: [],
          },
        ],
      },
    ] as unknown as TreeNode[]

    const nextTree = moveNode(treeWithSubfolder, 'parent', 'child')

    expect(nextTree).toEqual(treeWithSubfolder)
  })
})
