import type { JSONContent } from '@tiptap/react'

export interface NoteFile {
  id: string
  type: 'file'
  name: string
  title: string
  content: string
  contentDoc?: JSONContent
  editorVersion?: number
  tags: string[]
  parentId?: string | null
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  wordGoal?: number | null
}

export interface NoteFolder {
  id: string
  type: 'folder'
  name: string
  children: TreeNode[]
  parentId?: string | null
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type TreeNode = NoteFile | NoteFolder

export interface FlatNode {
  id: string
  type: 'file' | 'folder'
  name: string
  parentId: string | null
  [key: string]: unknown
}
