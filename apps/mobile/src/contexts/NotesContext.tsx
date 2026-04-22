import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { NoteFile, NoteFolder, TreeNode } from '@folio/shared'
import { fetchNotes, upsertNote, softDeleteNotes, rebuildTreeFromFlat, sortTreeNodes } from '@folio/shared'
import { getTree, saveTree, getPendingUpserts, savePendingUpserts, getPendingDeletes, savePendingDeletes } from '../lib/storage'
import { generateId } from '../lib/generateId'
import { useTreeManager } from '../hooks/useTreeManager'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface NotesContextValue {
  tree: TreeNode[]
  isLoading: boolean
  isSyncing: boolean
  createNote: (parentId: string | null) => NoteFile
  createFolder: (parentId: string | null, name: string) => NoteFolder
  updateNote: (id: string, updates: Partial<NoteFile>) => void
  deleteTreeNode: (id: string, subtreeIds: string[]) => void
  renameTreeNode: (id: string, name: string) => void
  moveTreeNode: (nodeId: string, newParentId: string | null) => void
  findNote: (id: string) => NoteFile | null
  syncNow: () => Promise<void>
}

const NotesContext = createContext<NotesContextValue | null>(null)

export function NotesProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const isOnline = useOnlineStatus()
  const isSyncingRef = useRef(false)

  const tm = useTreeManager([])

  // Persist tree whenever it changes (skip initial empty state)
  const hasLoaded = useRef(false)
  useEffect(() => {
    if (!hasLoaded.current) return
    saveTree(userId, tm.tree).catch(() => {})
  }, [tm.tree, userId])

  // Load tree on mount
  useEffect(() => {
    async function loadInitial() {
      const cached = await getTree(userId)
      if (cached && cached.length > 0) {
        tm.setTree(cached)
        hasLoaded.current = true
        setIsLoading(false)
        syncNow().catch(() => {})
      } else {
        try {
          const notes = await fetchNotes(userId)
          const tree = sortTreeNodes(rebuildTreeFromFlat(notes as Parameters<typeof rebuildTreeFromFlat>[0]))
          tm.setTree(tree)
          await saveTree(userId, tree)
        } catch {
          // offline — start with empty tree
        }
        hasLoaded.current = true
        setIsLoading(false)
      }
    }
    loadInitial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && hasLoaded.current) {
      syncNow().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  const syncNow = useCallback(async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    setIsSyncing(true)
    try {
      const deleteIds = await getPendingDeletes(userId)
      if (deleteIds.length > 0) {
        await softDeleteNotes(deleteIds)
        await savePendingDeletes(userId, [])
      }

      const pendingUpserts = await getPendingUpserts(userId)
      for (const note of pendingUpserts) {
        await upsertNote(note as unknown as Parameters<typeof upsertNote>[0], userId)
      }
      if (pendingUpserts.length > 0) {
        await savePendingUpserts(userId, [])
      }

      const notes = await fetchNotes(userId)
      const freshTree = sortTreeNodes(rebuildTreeFromFlat(notes as Parameters<typeof rebuildTreeFromFlat>[0]))
      tm.setTree(freshTree)
      await saveTree(userId, freshTree)
    } catch {
      // stay offline silently
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [userId])

  // Async queue helpers — callers fire-and-forget
  async function queueUpsert(node: NoteFile | NoteFolder) {
    const existing = await getPendingUpserts(userId)
    const without = existing.filter((n) => (n as { id?: string }).id !== node.id)
    await savePendingUpserts(userId, [...without, node as unknown as Record<string, unknown>])
  }

  async function queueDelete(subtreeIds: string[]) {
    const existing = await getPendingDeletes(userId)
    const merged = Array.from(new Set([...existing, ...subtreeIds]))
    await savePendingDeletes(userId, merged)
  }

  function afterMutation(node: NoteFile | NoteFolder) {
    queueUpsert(node)
      .then(() => {
        if (isOnline) {
          return syncNow()
        }
        return undefined
      })
      .catch(() => {})
  }

  function createNote(parentId: string | null): NoteFile {
    const now = new Date().toISOString()
    const note: NoteFile = {
      id: generateId(),
      type: 'file',
      name: 'Untitled',
      title: 'Untitled',
      content: '',
      tags: [],
      parentId,
      createdAt: now,
      updatedAt: now,
    }
    tm.insertNode(parentId, note)
    afterMutation(note)
    return note
  }

  function createFolder(parentId: string | null, name: string): NoteFolder {
    const now = new Date().toISOString()
    const folder: NoteFolder = {
      id: generateId(),
      type: 'folder',
      name,
      children: [],
      parentId,
      createdAt: now,
      updatedAt: now,
    }
    tm.insertNode(parentId, folder)
    afterMutation(folder)
    return folder
  }

  function updateNote(id: string, updates: Partial<NoteFile>) {
    const now = new Date().toISOString()
    const fullUpdates = { ...updates, updatedAt: now }
    tm.updateNode(id, fullUpdates)
    const existing = tm.findNode(id)
    if (existing && existing.type === 'file') {
      const updated = { ...existing, ...fullUpdates } as NoteFile
      queueUpsert(updated)
        .then(() => {
          if (isOnline) {
            return syncNow()
          }
          return undefined
        })
        .catch(() => {})
    }
  }

  function deleteTreeNode(id: string, subtreeIds: string[]) {
    tm.deleteNode(id)
    queueDelete(subtreeIds)
      .then(() => {
        if (isOnline) {
          return syncNow()
        }
        return undefined
      })
      .catch(() => {})
  }

  function renameTreeNode(id: string, name: string) {
    tm.renameNode(id, name)
    const node = tm.findNode(id)
    if (node) afterMutation({ ...node, name } as NoteFile | NoteFolder)
  }

  function moveTreeNode(nodeId: string, newParentId: string | null) {
    tm.moveNode(nodeId, newParentId)
    const node = tm.findNode(nodeId)
    if (node) afterMutation({ ...node, parentId: newParentId } as NoteFile | NoteFolder)
  }

  function findNote(id: string): NoteFile | null {
    const node = tm.findNode(id)
    return node?.type === 'file' ? (node as NoteFile) : null
  }

  return (
    <NotesContext.Provider
      value={{
        tree: tm.tree,
        isLoading,
        isSyncing,
        createNote,
        createFolder,
        updateNote,
        deleteTreeNode,
        renameTreeNode,
        moveTreeNode,
        findNote,
        syncNow,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext)
  if (!ctx) throw new Error('useNotes must be used inside <NotesProvider>')
  return ctx
}
