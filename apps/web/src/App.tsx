import { useEffect, useCallback, useRef, useState, useMemo } from 'react'

import {
  ComputerTerminalIcon,
  Search01Icon,
  Moon01Icon,
  File01Icon,
  Sun01Icon,
  Add01Icon,
} from '@hugeicons/core-free-icons'

import Icon from './components/Icon'
import Sidebar from './components/Sidebar'
import {
  collectSubtreeIds,
  deleteNode,
  findNode,
  flattenNodes,
  flattenTree,
  getParentId,
  insertNode,
  moveNode,
  rebuildTreeFromFlat,
  renameNode,
  updateFileNode,
} from './utils/tree'
import NoteEditor from './components/NoteEditor'
import AiChatPage from './components/AiChatPage'
import CommandPalette from './components/CommandPalette'
import type { PaletteItem } from './components/CommandPalette'
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import TemplateGallery from './components/TemplateGallery'
import WelcomeModal from './components/WelcomeModal'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { getEditorCommands } from './utils/editorCommands'
import { searchNotes } from './utils/knowledgeBase'
import { getNoteDisplayTitle, normalizeNote } from './utils/noteMeta'
import { fetchNotes, restoreNotes, softDeleteNotes, upsertNote } from './lib/notesDb'
import { exportNoteAsMarkdown } from './utils/exportNote'
import { ACCENT_COLORS } from './config/accents'
import { FONT_OPTIONS } from './config/fonts'
import { THEMES } from './config/themes'
import type { TreeNode, NoteFile, NoteFolder, FlatNode } from './types'
import type { EditorApi } from './components/LiveMarkdownEditor'
import type { Template } from './config/templates'

interface SaveStatus {
  state: 'syncing' | 'saved' | 'offline' | 'error' | 'demo'
  label: string
  detail: string
  error: string | null
  canRetry: boolean
}

interface SyncStatus {
  state: string
  message: string
  error: string | null
}

interface SyncToast {
  message: string
  variant: 'success' | 'error' | 'info'
}

interface DeletedNoteState {
  node: TreeNode
  syncableNodes: TreeNode[]
  nodeIds: string[]
  parentId: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TREE_STORAGE_KEY_PREFIX = 'canvas-tree:'
const PENDING_UPSERT_STORAGE_KEY_PREFIX = 'canvas-pending-upserts:'
const PENDING_DELETE_STORAGE_KEY_PREFIX = 'canvas-pending-delete:'
const ONBOARDING_SEEN_KEY_PREFIX = 'folio-onboarding-seen:'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return crypto.randomUUID()
}

function getTreeStorageKey(userId: string): string {
  return `${TREE_STORAGE_KEY_PREFIX}${userId}`
}

function getPendingDeleteStorageKey(userId: string): string {
  return `${PENDING_DELETE_STORAGE_KEY_PREFIX}${userId}`
}

function getPendingUpsertsStorageKey(userId: string): string {
  return `${PENDING_UPSERT_STORAGE_KEY_PREFIX}${userId}`
}

function loadTree(userId: string): TreeNode[] | null {
  if (!userId) {
    return null
  }

  try {
    const raw = localStorage.getItem(getTreeStorageKey(userId))
    if (raw) return JSON.parse(raw) as TreeNode[]
  } catch { /* corrupt or missing tree – fall through to null */ }
  return null
}

function saveTree(userId: string, tree: TreeNode[]): void {
  if (!userId) {
    return
  }

  localStorage.setItem(getTreeStorageKey(userId), JSON.stringify(tree))
}

function clearSavedTree(userId: string): void {
  if (!userId) {
    return
  }

  localStorage.removeItem(getTreeStorageKey(userId))
}

function loadPendingDeleteIds(userId: string): string[] {
  if (!userId) {
    return []
  }

  try {
    const raw = localStorage.getItem(getPendingDeleteStorageKey(userId))
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }
  } catch {
    return []
  }

  return []
}

function savePendingDeleteIds(userId: string, ids: string[]): void {
  if (!userId) {
    return
  }

  localStorage.setItem(getPendingDeleteStorageKey(userId), JSON.stringify(ids))
}

function loadPendingUpserts(userId: string): Record<string, TreeNode> {
  if (!userId) {
    return {}
  }

  try {
    const raw = localStorage.getItem(getPendingUpsertsStorageKey(userId))
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    }
  } catch {
    return {}
  }

  return {}
}

function savePendingUpserts(userId: string, pendingUpserts: Record<string, TreeNode>): void {
  if (!userId) {
    return
  }

  localStorage.setItem(getPendingUpsertsStorageKey(userId), JSON.stringify(pendingUpserts))
}

function clearPendingUpserts(userId: string): void {
  if (!userId) {
    return
  }

  localStorage.removeItem(getPendingUpsertsStorageKey(userId))
}

function clearPendingDeleteIds(userId: string): void {
  if (!userId) {
    return
  }

  localStorage.removeItem(getPendingDeleteStorageKey(userId))
}

function getOnboardingSeenKey(userId: string): string {
  return `${ONBOARDING_SEEN_KEY_PREFIX}${userId}`
}

function hasSeenOnboarding(userId: string): boolean {
  if (!userId) {
    return false
  }

  try {
    return localStorage.getItem(getOnboardingSeenKey(userId)) === 'true'
  } catch {
    return false
  }
}

function markOnboardingSeen(userId: string): void {
  if (!userId) {
    return
  }

  localStorage.setItem(getOnboardingSeenKey(userId), 'true')
}

function getInitialOnlineState(): boolean {
  if (typeof navigator === 'undefined') {
    return true
  }

  return navigator.onLine
}

const SAMPLE_NOTE = `# ✍️ Welcome to Folio

Folio is a fast, private markdown editor designed for speed and clarity. This note is your interactive onboarding guide to help you master the editor.

> [!tip] - Pro Tip
> Press \`Cmd + K\` (or \`Ctrl + K\`) to search notes, change fonts, or switch between Dark/Light mode.

---

## 🚀 Speed up with Slash Commands

Type \`/\` on a new line to see all available components. Try these new additions:

- \`/note\`, \`/tip\` or \`/warning\` — Create themed callouts instantly
- \`/todo\` — Insert a task checkbox
- \`/table\` — Insert a starter table
- \`/divider\` — Add a horizontal rule
- \`/today\` — Insert the current date

---

## 📝 Markdown Cheat Sheet

Folio supports standard markdown with some powerful enhancements:

### Typography
- **Bold**: \`**text**\`
- *Italic*: \`*text*\`
- ~~Strikethrough~~: \`~~text~~\`
- \`Inline Code\`: \` \`code\` \`
- [Links are easy](https://github.com/bm611/folio)

### Nested Lists & Tasks
Press \`Tab\` to indent and \`Shift + Tab\` to un-indent:
- Parent bullet
  - Nested child (circle)
    - Deeper child (square)
- [ ] Task lists support nesting too
  - [x] Sub-task one
  - [ ] Sub-task two
1. Numbered lists have distinct styles
  a. Alphabetic child
    i. Roman numeral child

### Code Blocks
Type \` \` \` \` followed by a language to start a block:

\`\`\`js
function hello() {
  console.log("Hello from Folio!");
}
\`\`\`

---

## 🏗️ Premium Components

### Interactive Callouts
Folio supports high-visibility callouts for expert organization.

> [!important] New Callout Controls
> - **Change Type**: Click the icon in the top-left of any callout to cycle through types (Note, Tip, Warning, etc.).
> - **Quick Delete**: Hover over a callout header to reveal the trash icon.
> - **Collapsible**: Use \`> [!note]+\` or \`> [!note]-\` to make them foldable.

> [!tip] - Cloud Sync
> **Sign in** to save your notes to the cloud and access them from any device.

### Tables
| Feature | Shortcut | Status |
| :--- | :--- | :--- |
| Slash Menu | \`/\` | ✅ |
| Nested Lists | \`Tab\` | ✅ |
| Mixed Callouts | \`/tip\` | ✅ |

---

## ⌨️ Useful Shortcuts

- \`Cmd + B\` — Toggle Sidebar
- \`Cmd + Shift + F\` — Toggle Focus Mode (distraction-free)
- \`Cmd + K\` — Open Command Palette
- \`Cmd + N\` — Create New Note

Ready to go? Create your first note from the **Sidebar** or press \`Cmd + N\`!
`

const ONBOARDING_NOTE = `# 🎉 Welcome to Folio!

You're all set up and ready to start writing. This note will help you discover Folio's powerful features.

> [!tip] - Your Notes are Safe
> Your notes are automatically saved and synced to the cloud. Access them from any device, anytime.

---

## ✨ Quick Start

### 1. Create Your First Note
Click the **New Note** button in the sidebar or press \`Cmd + N\`.

### 2. Use Slash Commands
Type \`/\` on a new line to see what you can create:
- \`/todo\` for task lists
- \`/table\` for tables
- \`/tip\`, \`/warning\`, \`/note\` for callouts
- \`/code\` for code blocks

### 3. Try Markdown
Folio supports full markdown syntax:
- **Bold** and *italic* text
- [Links](https://example.com)
- \`Inline code\` and code blocks
- Nested lists with Tab/Shift+Tab

---

## 📋 Example Task List

Here's a sample task list to get you started:

- [x] Sign up for Folio
- [ ] Create my first note
- [ ] Try slash commands
- [ ] Organize notes into folders
- [ ] Set up daily notes

---

## 🎨 Callouts

Use callouts to highlight important information:

> [!note] This is a note callout
> Great for general information and tips.

> [!tip] This is a tip callout
> Perfect for helpful suggestions and shortcuts.

> [!warning] This is a warning callout
> Use this for important reminders or cautions.

> [!important] This is an important callout
> For critical information that shouldn't be missed.

---

## 📊 Sample Table

| Feature | Description |
| :--- | :--- |
| Cloud Sync | Access notes anywhere |
| Slash Commands | Quick content insertion |
| Markdown Support | Full formatting power |
| Daily Notes | Track your daily thoughts |

---

## ⌨️ Keyboard Shortcuts

- \`Cmd + K\` — Command Palette (search, settings, themes)
- \`Cmd + N\` — New Note
- \`Cmd + B\` — Toggle Sidebar
- \`Cmd + S\` — Force Save
- \`Cmd + /\` — Toggle Comment (in code blocks)

---

## 🚀 Next Steps

1. **Delete this note** when you're comfortable with the basics
2. **Create folders** to organize your notes
3. **Use tags** to categorize and filter
4. **Try daily notes** for journaling
5. **Explore templates** from the command palette

Happy writing! ✍️
`

function matchesQuery(query: string, values: (string | undefined)[]): boolean {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return values.some((value) => value?.toLowerCase().includes(normalizedQuery))
}

/**
 * Ensures all notes tagged with 'daily' are moved into a root-level 'Daily' folder.
 * This provides robust folder persistence even when the underlying storage is flat.
 */
function ensureDailyFolder(tree: TreeNode[]): TreeNode[] {
  const allNotes = flattenTree(tree)
  const dailyNotes = allNotes.filter((n) => n.type === 'file' && (n as NoteFile).tags?.includes('daily')) as NoteFile[]

  const recursiveFilter = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .filter((n) => {
        if (n.type === 'file' && (n as NoteFile).tags?.includes('daily')) return false
        if (n.type === 'file' && (n as NoteFile).title === 'Daily' && n.name === 'Daily' && (!(n as NoteFile).content || (n as NoteFile).content.length < 5)) return false
        if (n.type === 'folder' && n.name.toLowerCase() === 'daily') return false
        return true
      })
      .map((n) => (n.type === 'folder' && (n as NoteFolder).children ? { ...n, children: recursiveFilter((n as NoteFolder).children) } : n))
  }

  const otherItems = recursiveFilter(tree)

  if (dailyNotes.length === 0) return otherItems

  const dailyFolder: NoteFolder = {
    id: 'folder-daily',
    type: 'folder',
    name: 'Daily',
    children: dailyNotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    createdAt: dailyNotes[dailyNotes.length - 1]!.createdAt,
    updatedAt: dailyNotes[0]!.updatedAt,
  }

  return [dailyFolder, ...otherItems]
}

function isSyntheticDailyFolder(node: TreeNode): boolean {
  return node?.type === 'folder' && node.id === 'folder-daily'
}

function getPersistedParentId(node: TreeNode, parentId: string | null | undefined): string | null {
  if (parentId === 'folder-daily' || (node.type === 'file' && (node as NoteFile).tags?.includes('daily'))) {
    return null
  }

  return parentId ?? null
}

function getSyncableTreeItems(tree: TreeNode[]): TreeNode[] {
  return (flattenNodes(tree || []) as unknown as TreeNode[])
    .filter((node) => !isSyntheticDailyFolder(node))
    .map((node) => ({
      ...node,
      parentId: getPersistedParentId(node, (node as TreeNode & { parentId?: string | null }).parentId),
    })) as TreeNode[]
}

function findSyncableItem(tree: TreeNode[], id: string): TreeNode | null {
  return (getSyncableTreeItems(tree) as (TreeNode & { id: string })[]).find((node) => node.id === id) ?? null
}

function buildTreeFromCloudAndPending(
  cloudNotes: TreeNode[],
  pendingUpserts: Record<string, TreeNode> = {},
  pendingDeleteIds: string[] = [],
): TreeNode[] {
  const pendingDeleteSet = new Set(pendingDeleteIds)
  const resolvedById = new Map<string, TreeNode>()

  for (const note of cloudNotes) {
    if (!pendingDeleteSet.has(note.id)) {
      resolvedById.set(note.id, { ...normalizeNote(note), syncError: null } as TreeNode & { syncError: null })
    }
  }

  for (const pendingNote of Object.values(pendingUpserts)) {
    const normalizedPendingNote = normalizeNote(pendingNote)
    if (!pendingDeleteSet.has(normalizedPendingNote.id)) {
      resolvedById.set(normalizedPendingNote.id, { ...normalizedPendingNote, syncError: null } as TreeNode & { syncError: null })
    }
  }

  return ensureDailyFolder(rebuildTreeFromFlat(Array.from(resolvedById.values()) as unknown as FlatNode[]))
}

function buildNodeMap(tree: TreeNode[]): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>()
  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      map.set(node.id, node)
      if (node.type === 'folder' && node.children) {
        traverse(node.children)
      }
    }
  }
  traverse(tree)
  return map
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

function makeSampleTree(): TreeNode[] {
  const now = new Date().toISOString()
  return [
    {
      id: generateId(),
      type: 'file',
      name: 'Folio Knowledge Base',
      title: 'Folio Knowledge Base',
      content: SAMPLE_NOTE,
      tags: [],
      createdAt: now,
      updatedAt: now,
    } as NoteFile,
  ]
}

function makeOnboardingTree(): TreeNode[] {
  const now = new Date().toISOString()
  return [
    {
      id: generateId(),
      type: 'file',
      name: 'Welcome to Folio',
      title: 'Welcome to Folio',
      content: ONBOARDING_NOTE,
      tags: [],
      createdAt: now,
      updatedAt: now,
    } as NoteFile,
  ]
}

function AppInner() {
  const { user, loading: authLoading } = useAuth()
  const [demoMode, setDemoMode] = useState(false)
  const demoModeRef = useRef(false)

  const [tree, setTree] = useState<TreeNode[]>(() => {
    // Synchronously preload cached tree from localStorage so the first render
    // already has notes, avoiding a blank-then-populated flash.
    try {
      const storedKey = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
      if (storedKey) {
        const stored = JSON.parse(localStorage.getItem(storedKey) || '{}')
        const userId = stored?.user?.id
        if (userId) {
          const cached = loadTree(userId)
          if (cached && cached.length > 0) return cached
        }
      }
    } catch { /* ignore — will hydrate from effect */ }
    return []
  })

  const notes = flattenTree(tree)

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'notes' | 'chat'>('notes')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Start collapsed on mobile
    return window.innerWidth < 768
  })
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('canvas-theme') || 'dark')
  const [fontId, setFontId] = useState(() => localStorage.getItem('canvas-font') || 'outfit')
  const [wideMode, setWideMode] = useState(() => localStorage.getItem('canvas-wide-mode') === 'true')
  const [accentId, setAccentId] = useState(() => localStorage.getItem('canvas-accent') || 'rose')
  const [editorReady, setEditorReady] = useState(false)
  const [deletedNote, setDeletedNote] = useState<DeletedNoteState | null>(null)
  const [showAuthPage, setShowAuthPage] = useState(false)
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [failedSyncNoteIds, setFailedSyncNoteIds] = useState<string[]>([])
  const [pendingUpserts, setPendingUpserts] = useState<Record<string, TreeNode>>({})
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(getInitialOnlineState)
  const [syncToast, setSyncToast] = useState<SyncToast | null>(null)
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cloudSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({})
  const syncToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sbWidth, setSbWidth] = useState(280)
  const editorApiRef = useRef<EditorApi | null>(null)
  const treeRef = useRef(tree)
  const nodeMapRef = useRef<Map<string, TreeNode>>(buildNodeMap(tree))
  const lastUserIdRef = useRef<string | null>(null)
  const pendingUpsertsRef = useRef<Record<string, TreeNode>>({})
  const pendingDeleteIdsRef = useRef<string[]>([])
  const hydrationInFlightRef = useRef(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  const hasPendingCloudSaves = useCallback(() => {
    return Object.values(cloudSaveTimers.current).some(Boolean)
  }, [])

  const finishSyncingIfIdle = useCallback(() => {
    if (!hasPendingCloudSaves()) {
      setSyncing(false)
    }
  }, [hasPendingCloudSaves])

  const showSyncToast = useCallback((message: string, variant: SyncToast['variant'] = 'success') => {
    setSyncToast({ message, variant })
    clearTimeout(syncToastTimerRef.current ?? undefined)
    syncToastTimerRef.current = setTimeout(() => {
      setSyncToast(null)
      syncToastTimerRef.current = null
    }, 2600)
  }, [])

  const queuePendingUpsert = useCallback((note: TreeNode) => {
    if (!note?.id) {
      return
    }

    const normalizedNote = normalizeNote(note)
    const nextPendingUpserts = {
      ...pendingUpsertsRef.current,
      [normalizedNote.id]: normalizedNote,
    }
    const nextPendingDeleteIds = pendingDeleteIdsRef.current.filter((id) => id !== normalizedNote.id)

    pendingUpsertsRef.current = nextPendingUpserts
    pendingDeleteIdsRef.current = nextPendingDeleteIds
    setPendingUpserts(nextPendingUpserts)
    setPendingDeleteIds(nextPendingDeleteIds)
  }, [])

  const clearPendingUpsert = useCallback((noteId: string) => {
    if (!noteId) {
      return
    }

    if (!(noteId in pendingUpsertsRef.current)) {
      return
    }

    const nextPendingUpserts = { ...pendingUpsertsRef.current }
    delete nextPendingUpserts[noteId]
    pendingUpsertsRef.current = nextPendingUpserts
    setPendingUpserts(nextPendingUpserts)
  }, [])

  const markPendingDelete = useCallback((nodeIds: string[]) => {
    if (!nodeIds?.length) {
      return
    }

    const nextPendingDeleteIds = Array.from(new Set([...pendingDeleteIdsRef.current, ...nodeIds]))
    const nextPendingUpserts = { ...pendingUpsertsRef.current }

    nodeIds.forEach((id) => {
      delete nextPendingUpserts[id]
    })

    pendingDeleteIdsRef.current = nextPendingDeleteIds
    pendingUpsertsRef.current = nextPendingUpserts
    setPendingDeleteIds(nextPendingDeleteIds)
    setPendingUpserts(nextPendingUpserts)
  }, [])

  const syncNoteToCloud = useCallback(async (noteOrId: string | TreeNode): Promise<boolean> => {
    if (!user) {
      return false
    }

    const noteId = typeof noteOrId === 'string' ? noteOrId : noteOrId?.id
    if (!noteId) {
      return false
    }

    const note = typeof noteOrId === 'string'
      ? findSyncableItem(treeRef.current, noteOrId)
      : noteOrId

    if (!note) {
      return false
    }

    if (!navigator.onLine) {
      const message = 'Offline — changes are saved and will retry when online.'
      setSyncError(message)
      queuePendingUpsert(note)
      setFailedSyncNoteIds((currentIds) => {
        const nextIds = currentIds.includes(noteId) ? currentIds : [...currentIds, noteId]
        return nextIds
      })
      setTree((previousTree) => updateFileNode(previousTree, noteId, {
        syncError: message,
        localCheckpointAt: new Date().toISOString(),
      }))
      return false
    }

    try {
      const parentId = getPersistedParentId(note, fastGetParentId(note.id))
      await upsertNote({ ...note, parentId } as unknown as Parameters<typeof upsertNote>[0], user.id)
      const syncedAt = new Date().toISOString()
      setSyncError(null)
      clearPendingUpsert(noteId)
      setFailedSyncNoteIds((currentIds) => currentIds.filter((id) => id !== noteId))
      setTree((previousTree) => {
        const nextTree = updateFileNode(previousTree, noteId, {
          lastSyncedAt: syncedAt,
          syncError: null,
        })

        return note.type === 'folder'
          ? renameNode(nextTree, noteId, note.name || (note as unknown as NoteFile).title || 'Untitled')
          : nextTree
      })
      return true
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Sync failed. Changes will retry when possible.'
      setSyncError(message)
      queuePendingUpsert(note)
      setFailedSyncNoteIds((currentIds) => (
        currentIds.includes(noteId) ? currentIds : [...currentIds, noteId]
      ))
      setTree((previousTree) => updateFileNode(previousTree, noteId, { syncError: message }))
      return false
    }
  }, [clearPendingUpsert, queuePendingUpsert, user])

  useEffect(() => {
    treeRef.current = tree
    nodeMapRef.current = buildNodeMap(tree)
  }, [tree])

  useEffect(() => {
    pendingUpsertsRef.current = pendingUpserts
  }, [pendingUpserts])

  useEffect(() => {
    pendingDeleteIdsRef.current = pendingDeleteIds
  }, [pendingDeleteIds])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    savePendingUpserts(user.id, pendingUpserts)
  }, [pendingUpserts, user?.id])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    savePendingDeleteIds(user.id, pendingDeleteIds)
  }, [pendingDeleteIds, user?.id])

  useEffect(() => {
    const handleConnectivityChange = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', handleConnectivityChange)
    window.addEventListener('offline', handleConnectivityChange)

    return () => {
      window.removeEventListener('online', handleConnectivityChange)
      window.removeEventListener('offline', handleConnectivityChange)
    }
  }, [])

  const fastFindNode = useCallback((id: string): TreeNode | null => {
    return nodeMapRef.current.get(id) ?? null
  }, [])

  const fastGetParentId = useCallback((nodeId: string): string | null => {
    for (const [id, node] of nodeMapRef.current) {
      if (node.type === 'folder' && node.children?.some((c) => c.id === nodeId)) {
        return id
      }
    }
    return null
  }, [])

  const flushPendingDeletes = useCallback(async (idsOverride?: string[]): Promise<boolean> => {
    const idsToDelete = idsOverride ?? pendingDeleteIdsRef.current

    if (!user || !navigator.onLine || idsToDelete.length === 0) {
      return false
    }

    try {
      await softDeleteNotes(idsToDelete)
      const nextPendingDeleteIds = pendingDeleteIdsRef.current.filter((id) => !idsToDelete.includes(id))
      pendingDeleteIdsRef.current = nextPendingDeleteIds
      setPendingDeleteIds(nextPendingDeleteIds)
      return true
    } catch (err: unknown) {
      setSyncError((err as Error)?.message || 'Sync failed. Changes will retry when possible.')
      return false
    }
  }, [user])

  const flushPendingUpserts = useCallback(async (pendingUpsertsOverride?: Record<string, TreeNode>): Promise<{ attempted: number; succeeded: number }> => {
    const pendingMap = pendingUpsertsOverride ?? pendingUpsertsRef.current
    const pendingNotes = Object.values(pendingMap)

    if (!user || !navigator.onLine || pendingNotes.length === 0) {
      return { attempted: 0, succeeded: 0 }
    }

    setSyncing(true)
    let successCount = 0
    let currentIndex = 0
    const CONCURRENCY_LIMIT = 5

    const worker = async () => {
      while (currentIndex < pendingNotes.length) {
        const index = currentIndex++
        const note = pendingNotes[index]
        if (!note) continue

        try {
          const didSync = await syncNoteToCloud(note)
          if (didSync) {
            successCount += 1
          }
        } catch (err) {
          console.error('Failed to sync note concurrently', err)
        }
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY_LIMIT, pendingNotes.length) }, worker)
    await Promise.all(workers)

    finishSyncingIfIdle()
    return { attempted: pendingNotes.length, succeeded: successCount }
  }, [finishSyncingIfIdle, syncNoteToCloud, user])

  useEffect(() => {
    if (!user || !isOnline || hydrationInFlightRef.current || pendingDeleteIds.length === 0) {
      return
    }

    flushPendingDeletes().catch(console.error)
  }, [flushPendingDeletes, isOnline, pendingDeleteIds.length, user])

  useEffect(() => {
    if (!user || !isOnline || hydrationInFlightRef.current || Object.keys(pendingUpserts).length === 0) {
      return
    }

    flushPendingUpserts().catch(console.error)
  }, [flushPendingUpserts, isOnline, pendingUpserts, user])

  const retryFailedSyncs = useCallback(async () => {
    if (!user || (failedSyncNoteIds.length === 0 && Object.keys(pendingUpsertsRef.current).length === 0 && pendingDeleteIdsRef.current.length === 0)) {
      return
    }

    if (!navigator.onLine) {
      setSyncError('Offline — changes are saved and will retry when online.')
      return
    }

    setSyncing(true)

    for (const noteId of failedSyncNoteIds) {
      window.clearTimeout(cloudSaveTimers.current[noteId] as ReturnType<typeof setTimeout> | undefined)
      cloudSaveTimers.current[noteId] = null
    }

    const didFlushDeletes = await flushPendingDeletes()
    const { attempted, succeeded } = await flushPendingUpserts()

    if (didFlushDeletes || (attempted > 0 && attempted === succeeded)) {
      showSyncToast('All changes synced', 'success')
    }
  }, [failedSyncNoteIds, flushPendingDeletes, flushPendingUpserts, showSyncToast, user])

  useEffect(() => {
    const timers = cloudSaveTimers.current
    const toastTimer = syncToastTimerRef.current
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) {
          window.clearTimeout(timer)
        }
      })

      window.clearTimeout(toastTimer as ReturnType<typeof setTimeout> | undefined)
    }
  }, [])

  const reconcileWithCloud = useCallback(async (options: { preserveSelection?: boolean } = {}) => {
    if (!user) {
      return
    }

    const { preserveSelection = true } = options

    if (!navigator.onLine) {
      hydrationInFlightRef.current = false
      setTree(buildTreeFromCloudAndPending([], pendingUpsertsRef.current, pendingDeleteIdsRef.current))
      setSyncError('Offline — changes are saved and will sync when online.')
      return
    }

    hydrationInFlightRef.current = true

    try {
      await flushPendingDeletes()
      const cloudNotes = await fetchNotes(user.id) as unknown as TreeNode[]
      const mergedTree = buildTreeFromCloudAndPending(
        cloudNotes,
        pendingUpsertsRef.current,
        pendingDeleteIdsRef.current,
      )

      setTree(mergedTree)
      setFailedSyncNoteIds((currentIds) => currentIds.filter((id) => findNode(mergedTree, id)))
      setSyncError(null)

      setActiveNoteId((currentId) => {
        if (!preserveSelection) {
          return null
        }

        return currentId && findNode(mergedTree, currentId) ? currentId : null
      })
    } finally {
      hydrationInFlightRef.current = false
    }
  }, [flushPendingDeletes, user])

  // ── Cloud sync: load notes when user signs in, revert on sign-out ────────
  useEffect(() => {
    let cancelled = false
    const previousUserId = lastUserIdRef.current

    if (!user) {
      // Auth still loading — don't clear the tree yet, the user may still be signed in
      if (authLoading) return

      setSyncing(false)
      setSyncError(null)
      setFailedSyncNoteIds([])
      hydrationInFlightRef.current = false
      pendingUpsertsRef.current = {}
      pendingDeleteIdsRef.current = []
      setPendingUpserts({})
      setPendingDeleteIds([])

      // Signed out — clear tree and go back to landing page
      setTree([])
      setDemoMode(false)
      demoModeRef.current = false
      setActiveNoteId(null)
      if (previousUserId) {
        clearSavedTree(previousUserId)
        clearPendingUpserts(previousUserId)
        clearPendingDeleteIds(previousUserId)
      }
      lastUserIdRef.current = null
      return
    }

    // Signed in — advance past landing/demo page automatically
    const savedTree = loadTree(user.id)
    const cachedPendingUpserts = loadPendingUpserts(user.id)
    const cachedPendingDeleteIds = loadPendingDeleteIds(user.id)

    lastUserIdRef.current = user.id
    setDemoMode(false)
    demoModeRef.current = false
    setShowAuthPage(false)
    setSyncError(null)
    pendingUpsertsRef.current = cachedPendingUpserts
    pendingDeleteIdsRef.current = cachedPendingDeleteIds
    setPendingUpserts(cachedPendingUpserts)
    setPendingDeleteIds(cachedPendingDeleteIds)

    const optimisticTree = buildTreeFromCloudAndPending([], cachedPendingUpserts, cachedPendingDeleteIds)
    const cachedTree = savedTree ? ensureDailyFolder(savedTree) : []
    setTree(optimisticTree.length > 0 ? optimisticTree : cachedTree)

    reconcileWithCloud({ preserveSelection: true })
      .then(() => {
        if (cancelled) {
          return
        }
        // Show welcome modal for new users with no notes
        if (!hasSeenOnboarding(user.id) && tree.length === 0) {
          // Create onboarding note automatically
          const onboardingTree = makeOnboardingTree()
          setTree(onboardingTree)
          const note = onboardingTree[0]
          if (note) {
            queuePendingUpsert(note)
            setSyncing(true)
            syncNoteToCloud(note).finally(() => {
              finishSyncingIfIdle()
            })
          }
          setShowWelcomeModal(true)
        }
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading])

  // Re-reconcile when the browser comes back online.
  // Skip the initial mount — the main sync effect (above) already handles that.
  const isOnlineInitialRef = useRef(true)
  useEffect(() => {
    if (isOnlineInitialRef.current) {
      isOnlineInitialRef.current = false
      return
    }

    if (!user || !isOnline || hydrationInFlightRef.current) {
      return
    }

    reconcileWithCloud({ preserveSelection: true }).catch(() => {})
  }, [isOnline, reconcileWithCloud, user])

  // Persist tree to localStorage on changes. Skip the very first render if the
  // tree was synchronously preloaded — it's already what's in storage.
  const treeSaveSkipRef = useRef(tree.length > 0)
  useEffect(() => {
    if (treeSaveSkipRef.current) {
      treeSaveSkipRef.current = false
      return
    }

    if (user) {
      saveTree(user.id, rebuildTreeFromFlat(getSyncableTreeItems(tree) as unknown as FlatNode[]))
    }
  }, [tree, user])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('canvas-theme', theme)
  }, [theme])

  useEffect(() => {
    const font = FONT_OPTIONS.find((option) => option.id === fontId)
    if (font) {
      document.documentElement.style.setProperty('--body-font', font.value)
    }
    localStorage.setItem('canvas-font', fontId)
  }, [fontId])

  useEffect(() => {
    localStorage.setItem('canvas-wide-mode', String(wideMode))
  }, [wideMode])

  useEffect(() => {
    const palette = ACCENT_COLORS.find((a) => a.id === accentId)
    if (palette) {
      const themeMode = THEMES.find((t) => t.id === theme)?.mode ?? 'dark'
      const c = themeMode === 'dark' ? palette.dark : palette.light
      document.documentElement.style.setProperty('--accent', c.accent)
      document.documentElement.style.setProperty('--accent-hover', c.accentHover)
      document.documentElement.style.setProperty('--color-h1', c.colorH1)
    }
    localStorage.setItem('canvas-accent', accentId)
  }, [accentId, theme])

  const openCommandPalette = useCallback(() => {
    setCommandPaletteQuery('')
    setCommandPaletteOpen(true)
  }, [])

  const closeCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false)
    setCommandPaletteQuery('')
  }, [])

  const handleWelcomeModalClose = useCallback(() => {
    setShowWelcomeModal(false)
    if (user) {
      markOnboardingSeen(user.id)
    }
  }, [user])

  const handleGetStarted = useCallback(() => {
    handleWelcomeModalClose()
  }, [handleWelcomeModalClose])

  const createFolder = useCallback((name: string, parentId: string | null = null) => {
    const now = new Date().toISOString()
    const folder = normalizeNote({
      id: generateId(),
      type: 'folder',
      name,
      title: name,
      children: [],
      createdAt: now,
      updatedAt: now,
    } as unknown as TreeNode)

    setTree((previousTree) => insertNode(previousTree, parentId, folder))

    if (user) {
      queuePendingUpsert({ ...folder, parentId } as TreeNode & { parentId: string | null })
      setSyncing(true)
      syncNoteToCloud({ ...folder, parentId } as TreeNode & { parentId: string | null }).finally(() => {
        finishSyncingIfIdle()
      })
    }

    return folder
  }, [finishSyncingIfIdle, queuePendingUpsert, syncNoteToCloud, user])

  const handleRenameNode = useCallback((id: string, name: string) => {
    const now = new Date().toISOString()
    const existingNode = fastFindNode(id)

    if (!existingNode) {
      return
    }

    const updates = {
      name,
      title: name,
      updatedAt: now,
      localCheckpointAt: now,
    }
    const updatedNode = normalizeNote({ ...existingNode, ...updates, parentId: fastGetParentId(id) } as TreeNode & { parentId: string | null })

    setTree((previousTree) => renameNode(previousTree, id, name))

    if (!user) {
      return
    }

    if (!isOnline) {
      const message = 'Offline — changes are saved and will retry when online.'
      setSyncError(message)
      queuePendingUpsert(updatedNode)
      setFailedSyncNoteIds((currentIds) => (
        currentIds.includes(id) ? currentIds : [...currentIds, id]
      ))
      setTree((previousTree) => updateFileNode(previousTree, id, { syncError: message, ...updates }))
      return
    }

    setTree((previousTree) => updateFileNode(previousTree, id, updates))
    queuePendingUpsert(updatedNode)
    setSyncing(true)
    clearTimeout(cloudSaveTimers.current[id] ?? undefined)
    cloudSaveTimers.current[id] = setTimeout(() => {
      syncNoteToCloud(id).finally(() => {
        cloudSaveTimers.current[id] = null
        finishSyncingIfIdle()
      })
    }, 250)
  }, [finishSyncingIfIdle, isOnline, queuePendingUpsert, syncNoteToCloud, user])

  const handleMoveNode = useCallback(
    (id: string, newParentId: string | null) => {
      const existingNode = fastFindNode(id)
      if (!existingNode) return

      setTree((previousTree) => moveNode(previousTree, id, newParentId))

      if (!user) return

      const now = new Date().toISOString()

      if (existingNode.type === 'file') {
        const updatedNode = normalizeNote({
          ...existingNode,
          parentId: newParentId,
          updatedAt: now,
        } as TreeNode & { parentId: string | null })

        if (!isOnline) {
          const message = 'Offline — changes are saved and will retry when online.'
          setSyncError(message)
          queuePendingUpsert(updatedNode)
          setFailedSyncNoteIds((currentIds) =>
            currentIds.includes(id) ? currentIds : [...currentIds, id]
          )
          return
        }

        queuePendingUpsert(updatedNode)
        setSyncing(true)
        clearTimeout(cloudSaveTimers.current[id] ?? undefined)
        cloudSaveTimers.current[id] = setTimeout(() => {
          syncNoteToCloud(id).finally(() => {
            cloudSaveTimers.current[id] = null
            finishSyncingIfIdle()
          })
        }, 250)
      } else {
        const folderWithParent = { ...existingNode, parentId: newParentId } as TreeNode & { parentId: string | null }
        if (!isOnline) {
          queuePendingUpsert(folderWithParent)
          return
        }
        queuePendingUpsert(folderWithParent)
        setSyncing(true)
        syncNoteToCloud(folderWithParent).finally(() => {
          finishSyncingIfIdle()
        })
      }
    },
    [finishSyncingIfIdle, isOnline, queuePendingUpsert, syncNoteToCloud, user]
  )

  const createNote = useCallback(
    (overrides: Partial<NoteFile> = {}, options: { parentId?: string | null; activate?: boolean } = {}) => {
      const now = new Date().toISOString()
      const parentId = options.parentId ?? null
      const note = normalizeNote({
        id: generateId(),
        type: 'file',
        name: overrides.title || 'Untitled',
        title: overrides.title || '',
        content: '',
        tags: [],
        createdAt: now,
        updatedAt: now,
        ...overrides,
      } as NoteFile)

      setTree((previousTree) => insertNode(previousTree, parentId, note))

      // Immediately persist to cloud if signed in
      if (user) {
        queuePendingUpsert({ ...note, parentId } as TreeNode & { parentId: string | null })
        setSyncing(true)
        syncNoteToCloud({ ...note, parentId } as TreeNode & { parentId: string | null }).finally(() => {
          finishSyncingIfIdle()
        })
      }

      if (options.activate !== false) {
        setActiveNoteId(note.id)
      }

      return note
    },
    [finishSyncingIfIdle, queuePendingUpsert, syncNoteToCloud, user],
  )

  const handleNewNote = useCallback(() => {
    createNote()
  }, [createNote])

  const handleCreateDailyNote = useCallback(() => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    const dateStr = `${day}-${month}-${year}`

    const existingNote = notes.find((n) => n.type === 'file' && (n as NoteFile).title === dateStr && (n as NoteFile).tags?.includes('daily'))
    if (existingNote) {
      setActiveNoteId(existingNote.id)
      if (sidebarCollapsed) setSidebarCollapsed(false)
      return
    }

    const template = `
## Journal
- tbd

## To-Dos
[ ] 

## Ideas & Notes
- tbd
`.trim()

    const now = new Date().toISOString()
    const newNote = normalizeNote({
      id: generateId(),
      type: 'file',
      name: dateStr,
      title: dateStr,
      content: template,
      tags: ['daily'],
      createdAt: now,
      updatedAt: now,
    } as NoteFile)

    setTree((prevTree) => {
      const newTree = insertNode(prevTree, null, newNote)
      return ensureDailyFolder(newTree)
    })

    if (user) {
      setSyncing(true)
      syncNoteToCloud(newNote).finally(() => {
        finishSyncingIfIdle()
      })
    }

    setActiveNoteId(newNote.id)
  }, [finishSyncingIfIdle, notes, sidebarCollapsed, syncNoteToCloud, user])

  const handleSelectTemplate = useCallback(
    (template: Template) => {
      const now = new Date().toISOString()
      const newNote = normalizeNote({
        id: generateId(),
        type: 'file',
        name: template.name,
        title: template.name,
        content: template.content,
        tags: template.tags,
        createdAt: now,
        updatedAt: now,
      } as NoteFile)

      setTree((prevTree) => insertNode(prevTree, null, newNote))

      if (user) {
        setSyncing(true)
        syncNoteToCloud(newNote).finally(() => {
          finishSyncingIfIdle()
        })
      }

      setActiveNoteId(newNote.id)
    },
    [finishSyncingIfIdle, syncNoteToCloud, user],
  )

  const handleDeleteNote = useCallback(
    (id: string) => {
      const nodeToDelete = findNode(tree, id)
      if (!nodeToDelete) return

      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }

      const nodeIdsToDelete = collectSubtreeIds(tree, id)
      const syncableDeletedNodes = getSyncableTreeItems([nodeToDelete])

      nodeIdsToDelete.forEach((nodeId) => {
        window.clearTimeout(cloudSaveTimers.current[nodeId] as ReturnType<typeof setTimeout> | undefined)
        cloudSaveTimers.current[nodeId] = null
      })

      setFailedSyncNoteIds((currentIds) => (
        currentIds.filter((currentId) => !nodeIdsToDelete.includes(currentId))
      ))
      markPendingDelete(nodeIdsToDelete)
      finishSyncingIfIdle()

      setTree((previousTree) => deleteNode(previousTree, id))

      if (user && navigator.onLine) {
        setSyncing(true)
        softDeleteNotes(nodeIdsToDelete)
          .then(() => {
            const nextPendingDeleteIds = pendingDeleteIdsRef.current.filter((currentId) => !nodeIdsToDelete.includes(currentId))
            pendingDeleteIdsRef.current = nextPendingDeleteIds
            setPendingDeleteIds(nextPendingDeleteIds)
            reconcileWithCloud({ preserveSelection: true }).catch(() => {})
          })
          .catch((err: unknown) => {
            setSyncError((err as Error)?.message || 'Sync failed. Changes will retry when possible.')
          })
          .finally(() => {
            finishSyncingIfIdle()
          })
      } else if (user) {
        setSyncError('Offline — changes are saved and will retry when online.')
      }

      if (activeNoteId === id) {
        setActiveNoteId(null)
      } else if (nodeToDelete.type === 'folder') {
        if (nodeIdsToDelete.includes(activeNoteId!)) {
          setActiveNoteId(null)
        }
      }

      setDeletedNote({
        node: nodeToDelete,
        syncableNodes: syncableDeletedNodes,
        nodeIds: nodeIdsToDelete,
        parentId: getParentId(tree, id),
      })

      // Auto-dismiss after 5 seconds
      deleteTimerRef.current = setTimeout(() => {
        setDeletedNote(null)
        deleteTimerRef.current = null
      }, 5000)
    },
    [activeNoteId, finishSyncingIfIdle, markPendingDelete, reconcileWithCloud, tree, user],
  )

  const handleUndoDelete = useCallback(() => {
    if (!deletedNote) return
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = null
    }
    setTree((previousTree) => insertNode(previousTree, deletedNote.parentId ?? null, deletedNote.node))
    const nextPendingDeleteIds = pendingDeleteIdsRef.current.filter((id) => !deletedNote.nodeIds.includes(id))
    pendingDeleteIdsRef.current = nextPendingDeleteIds
    setPendingDeleteIds(nextPendingDeleteIds)
    deletedNote.syncableNodes.forEach((node) => {
      queuePendingUpsert(node)
    })

    if (user && navigator.onLine) {
      setSyncing(true)
      restoreNotes(deletedNote.syncableNodes as unknown as Parameters<typeof restoreNotes>[0], user.id)
        .then(() => {
          deletedNote.syncableNodes.forEach((node) => {
            clearPendingUpsert(node.id)
          })
          reconcileWithCloud({ preserveSelection: true }).catch(() => {})
        })
        .catch((err: unknown) => {
          setSyncError((err as Error)?.message || 'Sync failed. Changes will retry when possible.')
          const restoredPendingDeleteIds = Array.from(new Set([...pendingDeleteIdsRef.current, ...deletedNote.nodeIds]))
          pendingDeleteIdsRef.current = restoredPendingDeleteIds
          setPendingDeleteIds(restoredPendingDeleteIds)
        })
        .finally(() => {
          finishSyncingIfIdle()
        })
    } else if (user) {
      setSyncError('Offline — changes are saved and will retry when online.')
    }

    setActiveNoteId(deletedNote.node.id)
    setDeletedNote(null)
  }, [clearPendingUpsert, deletedNote, finishSyncingIfIdle, queuePendingUpsert, reconcileWithCloud, user])

  useEffect(() => {
    if (!user) {
      return
    }

    const handleFocusSync = () => {
      if (hydrationInFlightRef.current) {
        return
      }

      reconcileWithCloud({ preserveSelection: true }).catch(() => {})
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !hydrationInFlightRef.current) {
        reconcileWithCloud({ preserveSelection: true }).catch(() => {})
      }
    }

    window.addEventListener('focus', handleFocusSync)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocusSync)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [reconcileWithCloud, user])

  const handleUpdateNote = useCallback((id: string, updates: Record<string, unknown>, options: { skipTimestamp?: boolean } = {}) => {
    const now = new Date().toISOString()
    const updatedValues: Record<string, unknown> = {
      ...updates,
      localCheckpointAt: now,
    }
    if (updates.title !== undefined) updatedValues.name = updates.title
    if (!options.skipTimestamp) updatedValues.updatedAt = now

    setTree((previousTree) => {
      return updateFileNode(previousTree, id, updatedValues)
    })

    if (!user) {
      return
    }

    if (!isOnline) {
      const message = 'Offline — changes are saved and will retry when online.'
      setSyncError(message)
      const currentNode = fastFindNode(id)
      if (currentNode) {
        queuePendingUpsert({
          ...currentNode,
          ...updatedValues,
          parentId: fastGetParentId(id),
        } as TreeNode & { parentId: string | null })
      }
      setFailedSyncNoteIds((currentIds) => (
        currentIds.includes(id) ? currentIds : [...currentIds, id]
      ))
      setTree((previousTree) => updateFileNode(previousTree, id, { syncError: message }))
      return
    }

    // Debounced cloud save (1.5s after last keystroke)
    const currentNode = fastFindNode(id)
    if (currentNode) {
      queuePendingUpsert({
        ...currentNode,
        ...updatedValues,
        parentId: fastGetParentId(id),
      } as TreeNode & { parentId: string | null })
    }
    setSyncing(true)
    clearTimeout(cloudSaveTimers.current[id] ?? undefined)
    cloudSaveTimers.current[id] = setTimeout(() => {
      syncNoteToCloud(id).finally(() => {
        cloudSaveTimers.current[id] = null
        finishSyncingIfIdle()
      })
    }, 1500)
  }, [finishSyncingIfIdle, isOnline, queuePendingUpsert, syncNoteToCloud, user])

  const handleChangeIcon = useCallback((id: string, icon: string | null) => {
    const now = new Date().toISOString()
    const existingNode = fastFindNode(id)
    if (!existingNode) return

    const updates = { icon, updatedAt: now, localCheckpointAt: now }
    const updatedNode = normalizeNote({ ...existingNode, ...updates, parentId: fastGetParentId(id) } as TreeNode & { parentId: string | null })

    setTree((previousTree) => updateFileNode(previousTree, id, updates))

    if (!user) return

    if (!isOnline) {
      queuePendingUpsert(updatedNode)
      return
    }

    queuePendingUpsert(updatedNode)
    setSyncing(true)
    clearTimeout(cloudSaveTimers.current[id] ?? undefined)
    cloudSaveTimers.current[id] = setTimeout(() => {
      syncNoteToCloud(id).finally(() => {
        cloudSaveTimers.current[id] = null
        finishSyncingIfIdle()
      })
    }, 250)
  }, [finishSyncingIfIdle, isOnline, queuePendingUpsert, syncNoteToCloud, user])

  const cycleTheme = useCallback(() => {
    const themeIds = THEMES.map((t) => t.id)
    setTheme((t) => {
      const i = themeIds.indexOf(t)
      return themeIds[(i + 1) % themeIds.length] ?? themeIds[0] ?? t
    })
  }, [])

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = sbWidth
    const move = (ev: MouseEvent) => setSbWidth(Math.max(160, Math.min(500, startW + ev.clientX - startX)))
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [sbWidth])

  // Swipe-from-left-edge to open sidebar
  useEffect(() => {
    let startX = 0
    let startY = 0
    let tracking = false

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch && touch.clientX < 24 && sidebarCollapsed) {
        startX = touch.clientX
        startY = touch.clientY
        tracking = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return
      const touch = e.touches[0]
      if (!touch) return
      const dx = touch.clientX - startX
      const dy = Math.abs(touch.clientY - startY)
      if (dx > 60 && dy < 40) {
        setSidebarCollapsed(false)
        tracking = false
      }
    }

    const onTouchEnd = () => { tracking = false }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [sidebarCollapsed])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        handleNewNote()
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setSidebarCollapsed((current) => !current)
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openCommandPalette()
      }

    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewNote, openCommandPalette])

  const activeNote = useMemo((): NoteFile | null => {
    if (!activeNoteId) return null
    const node = findNode(tree, activeNoteId)
    if (!node || node.type !== 'file') return null
    return node as NoteFile
  }, [activeNoteId, tree])

  const activeNoteSyncFailed = activeNote
    ? failedSyncNoteIds.includes(activeNote.id)
    : failedSyncNoteIds.length > 0

  const activeNoteLastSavedAt = activeNote
    ? (user
      ? (activeNote as NoteFile & { lastSyncedAt?: string; localCheckpointAt?: string }).lastSyncedAt || (activeNote as NoteFile & { localCheckpointAt?: string }).localCheckpointAt
      : (activeNote as NoteFile & { localCheckpointAt?: string }).localCheckpointAt || activeNote.updatedAt)
    : null

  let saveStatus: SaveStatus = {
    state: 'demo',
    label: 'Not saved',
    detail: 'Sign in to save your notes',
    error: null,
    canRetry: false,
  }

  if (user) {
    saveStatus = {
      state: 'saved',
      label: 'Saved',
      detail: 'Backed up to cloud',
      error: null,
      canRetry: false,
    }

    if (!isOnline) {
      saveStatus = {
        state: 'offline',
        label: 'Offline',
        detail: 'Changes saved, will sync when connection returns',
        error: null,
        canRetry: false,
      }
    } else if (syncing) {
      saveStatus = {
        state: 'syncing',
        label: 'Saving…',
        detail: 'Syncing with cloud',
        error: null,
        canRetry: false,
      }
    } else if (activeNoteSyncFailed || syncError) {
      saveStatus = {
        state: 'error',
        label: 'Sync failed',
        detail: 'Changes are safe, will retry sync',
        error: (activeNote as NoteFile & { syncError?: string })?.syncError || syncError,
        canRetry: true,
      }
    }
  }

  const sidebarSyncStatus: SyncStatus = {
    state: !user
      ? 'demo'
      : (!isOnline
        ? 'offline'
        : (syncing
          ? 'syncing'
          : (failedSyncNoteIds.length > 0 ? 'error' : 'saved'))),
    message: !user
      ? 'Not saved'
      : (!isOnline
        ? 'Offline'
        : (syncing
          ? 'Saving…'
          : (failedSyncNoteIds.length > 0 ? 'Sync failed' : 'Synced'))),
    error: syncError,
  }

  const paletteNoteResults = searchNotes(notes as { id?: string; title?: string; content: string; updatedAt?: string; createdAt?: string }[], commandPaletteQuery).slice(0, 8)
  const paletteCommandResults = editorReady ? getEditorCommands(commandPaletteQuery).slice(0, 6) : []

  const actionItems: PaletteItem[] = [
    {
      id: 'action-new-note',
      section: 'Actions',
      title: 'New note',
      subtitle: 'Create a blank note',
      icon: <Icon icon={Add01Icon} size={16} strokeWidth={1.5} />,
      keywords: ['create', 'note', 'new'],
      run: () => handleNewNote(),
    },
    {
      id: 'action-toggle-theme',
      section: 'Actions',
      title: 'Cycle theme',
      subtitle: 'Cycle through all themes',
      icon: THEMES.find((t) => t.id === theme)?.mode === 'dark' ? <Icon icon={Sun01Icon} size={16} strokeWidth={1.5} /> : <Icon icon={Moon01Icon} size={16} strokeWidth={1.5} />,
      keywords: ['theme', 'color', 'dark', 'light', 'catppuccin', 'ayu', 'tokyo'],
      run: () => cycleTheme(),
    },
    {
      id: 'action-focus-search',
      section: 'Actions',
      title: 'Reveal sidebar search',
      subtitle: 'Open the note index and search surface',
      icon: <Icon icon={Search01Icon} size={16} strokeWidth={1.5} />,
      keywords: ['search', 'find', 'sidebar'],
      run: () => setSidebarCollapsed(false),
    },
  ].filter((item) =>
    matchesQuery(commandPaletteQuery, [item.title, item.subtitle, ...(item.keywords || [])]),
  )

  const fontItems: PaletteItem[] = FONT_OPTIONS.filter((option) =>
    matchesQuery(commandPaletteQuery, [option.name, 'font typography']),
  ).map((option) => ({
    id: `font-${option.id}`,
    section: 'Fonts',
    title: option.name,
    subtitle: 'Switch editor typography',
    hint: option.id === fontId ? 'active' : '',
    keywords: ['font', 'type', option.name],
    run: () => setFontId(option.id),
  }))

  const noteItems: PaletteItem[] = paletteNoteResults.map((result) => ({
    id: `note-${result.note.id}`,
    section: 'Notes',
    title: getNoteDisplayTitle(result.note),
    subtitle: result.excerpt,
    icon: <Icon icon={File01Icon} size={16} strokeWidth={1.5} />,
    hint: '',
    keywords: ['note'],
    run: () => setActiveNoteId(result.note.id as string),
  }))

  const editorItems: PaletteItem[] = paletteCommandResults.map((command) => ({
    id: `editor-${command.id}`,
    section: 'Insert',
    title: command.title,
    subtitle: `Insert /${command.trigger} into the editor`,
    icon: <Icon icon={ComputerTerminalIcon} size={16} strokeWidth={1.5} />,
    keywords: command.keywords || [],
    run: () => {
      editorApiRef.current?.focus()
      editorApiRef.current?.runCommand(command.id)
    },
  }))

  const exportItems: PaletteItem[] = activeNote ? [
    {
      id: 'action-export-note',
      section: 'Actions',
      title: 'Export note as Markdown',
      subtitle: 'Download the current note as a .md file',
      keywords: ['export', 'download', 'markdown', 'md'],
      run: () => exportNoteAsMarkdown(activeNote),
    },
  ] : []

  const allPaletteItems: PaletteItem[] = [...actionItems, ...exportItems, ...fontItems, ...noteItems, ...editorItems]

  const handleStart = useCallback(() => {
    // Enter demo mode with the sample note — nothing is persisted
    setTree(makeSampleTree())
    setDemoMode(true)
    demoModeRef.current = true
    // Show welcome modal for demo mode testing
    setShowWelcomeModal(true)
  }, [])

  // While auth is resolving, render nothing so the HTML loading indicator stays
  // visible and we avoid flashing the LandingPage for signed-in users.
  if (authLoading) return null

  // Show landing page for unauthenticated users who haven't entered demo mode
  if (!user && !demoMode) {
    if (showAuthPage) {
      return <AuthPage onBack={() => setShowAuthPage(false)} />
    }

    return (
      <>
        <LandingPage
          onStart={handleStart}
          onSignIn={() => setShowAuthPage(true)}
        />
      </>
    )
  }

  return (
    <>
      <div className="grain flex h-[100dvh] overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)]">
        <Sidebar
          tree={tree}
          activeNoteId={activeNoteId}
          onSelectNote={(id) => {
            setActiveView('notes')
            setActiveNoteId(id)
          }}
          onNewNote={createNote}
          onNewFolder={createFolder}
          onDeleteNote={handleDeleteNote}
          onRenameNode={handleRenameNode}
          onMoveNode={handleMoveNode}
          onChangeIcon={handleChangeIcon}
          syncing={syncing}
          syncStatus={sidebarSyncStatus}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          searchQuery={sidebarSearch}
          onSearchChange={setSidebarSearch}
          width={sbWidth}
          onResizeStart={onResizeStart}
          onOpenTemplateGallery={() => setTemplateGalleryOpen(true)}
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view)
            if (view === 'notes') setActiveNoteId(null)
          }}
        />

        <div className="flex flex-1 min-w-0 transition-[padding] duration-300 p-0 md:p-2 md:pl-0">
          {activeView === 'chat' ? (
            <AiChatPage
              notes={notes.filter((n): n is NoteFile => n.type === 'file' && !n.deletedAt)}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
              onCloseChat={() => setActiveView('notes')}
              onSaveToNote={(noteId, content) => {
                const note = notes.find((n) => n.id === noteId)
                if (!note || note.type !== 'file') return
                const existing = note.content || ''
                const separator = existing.trim() ? '\n\n' : ''
                handleUpdateNote(noteId, { content: existing + separator + content, contentDoc: null })
              }}
            />
          ) : (
            <NoteEditor
              note={activeNote}
              notes={notes}
              tree={tree}
              onNewNote={handleNewNote}
              onCreateDailyNote={handleCreateDailyNote}
              onUpdateNote={handleUpdateNote}
              onSelectNote={(id) => {
                setActiveView('notes')
                setActiveNoteId(id)
              }}
              onRegisterEditorApi={(api) => {
                editorApiRef.current = api
                setEditorReady(Boolean(api))
              }}
              theme={theme}
              onSetTheme={setTheme}
              onCycleTheme={cycleTheme}
              accentId={accentId}
              onAccentChange={setAccentId}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
              onOpenCommandPalette={openCommandPalette}
              onOpenAuthModal={() => setShowAuthPage(true)}
              saveStatus={saveStatus}
              lastSavedAt={activeNoteLastSavedAt ?? null}
              onRetrySync={retryFailedSyncs}
              syncing={syncing}
              syncStatus={sidebarSyncStatus}
              onSync={async () => {
                if (!navigator.onLine) {
                  showSyncToast('Offline — changes saved locally', 'info')
                  return
                }
                try {
                  await reconcileWithCloud()
                  showSyncToast('Synced to cloud', 'success')
                } catch {
                  showSyncToast('Sync failed — check your connection', 'error')
                }
              }}
              fontId={fontId}
              onFontChange={setFontId}
              wideMode={wideMode}
              onWideModeChange={setWideMode}
            />
          )}
        </div>
      </div>

      <CommandPalette
        key={commandPaletteOpen ? 'palette-open' : 'palette-closed'}
        open={commandPaletteOpen}
        query={commandPaletteQuery}
        items={allPaletteItems}
        onClose={closeCommandPalette}
        onQueryChange={setCommandPaletteQuery}
        onSelectItem={(item) => {
          item.run()
          closeCommandPalette()
        }}
      />

      {deletedNote && (
        <div
          className="fixed bottom-20 md:bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-3"
          style={{ boxShadow: 'var(--neu-shadow)' }}
        >
          <span className="text-sm text-[var(--text-secondary)]">{deletedNote.node.type === 'folder' ? 'Folder deleted' : 'Note deleted'}</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white transition-[transform,filter] duration-150 ease-out hover:brightness-110 active:scale-[0.96]"
          >
            Undo
          </button>
        </div>
      )}

      {syncToast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-4 py-2 text-xs text-[var(--text-primary)] ${
            syncToast.variant === 'error'
              ? 'bg-[color-mix(in_srgb,var(--danger)_14%,var(--bg-elevated))]'
              : syncToast.variant === 'info'
              ? 'bg-[color-mix(in_srgb,var(--warning)_14%,var(--bg-elevated))]'
              : 'bg-[color-mix(in_srgb,var(--success)_14%,var(--bg-elevated))]'
          }`}
          style={{ boxShadow: 'var(--neu-shadow)' }}
        >
          {syncToast.message}
        </div>
      )}

      <TemplateGallery
        open={templateGalleryOpen}
        onClose={() => setTemplateGalleryOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <WelcomeModal
        open={showWelcomeModal}
        onClose={handleWelcomeModalClose}
        onGetStarted={handleGetStarted}
      />

      {showAuthPage && (
        <AuthPage onBack={() => setShowAuthPage(false)} />
      )}
    </>
  )
}
