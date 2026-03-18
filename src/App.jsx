import { useEffect, useCallback, useRef, useState } from 'react'
import {
  ArrowShrinkIcon,
  ArrowExpandIcon,
  ComputerTerminalIcon,
  Search01Icon,
  Moon01Icon,
  File01Icon,
  Sun01Icon,
  Add01Icon,
} from '@hugeicons/core-free-icons'
import Icon from './components/Icon'

import Sidebar from './components/Sidebar'
import { flattenTree, insertNode, deleteNode, updateFileNode, findNode } from './utils/tree'
import NoteEditor from './components/NoteEditor'
import CommandPalette from './components/CommandPalette'
import LandingPage from './components/LandingPage'
import AuthModal from './components/AuthModal'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { getEditorCommands } from './utils/editorCommands'
import { searchNotes } from './utils/knowledgeBase'
import { getNoteDisplayTitle, normalizeNote } from './utils/noteMeta'
import { fetchNotes, upsertNote, deleteNote as dbDeleteNote } from './lib/notesDb'
import { docToMarkdown } from './editor/markdown/markdownConversion'
import { ACCENT_COLORS } from './config/accents'

const TREE_STORAGE_KEY = 'canvas-tree'

const FONT_OPTIONS = [
  { id: 'outfit', name: 'Outfit', value: '"Outfit", sans-serif' },
  { id: 'lora', name: 'Lora', value: '"Lora", "Georgia", serif' },
  { id: 'fraunces', name: 'Fraunces', value: '"Fraunces", "Georgia", serif' },
  { id: 'newsreader', name: 'Newsreader', value: '"Newsreader", "Georgia", serif' },
  { id: 'inter', name: 'Inter', value: '"Inter", sans-serif' },
  { id: 'dm-sans', name: 'DM Sans', value: '"DM Sans", "Helvetica Neue", sans-serif' },
  { id: 'ibm-plex', name: 'IBM Plex Sans', value: '"IBM Plex Sans", "Helvetica Neue", sans-serif' },
]

function generateId() {
  return crypto.randomUUID()
}

function loadTree() {
  try {
    const raw = localStorage.getItem(TREE_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* corrupt or missing tree – fall through to null */ }
  return null
}

function saveTree(tree) {
  localStorage.setItem(TREE_STORAGE_KEY, JSON.stringify(tree))
}

function clearSavedTree() {
  localStorage.removeItem(TREE_STORAGE_KEY)
}

function getInitialOnlineState() {
  if (typeof navigator === 'undefined') {
    return true
  }

  return navigator.onLine
}

const SAMPLE_NOTE = `# ✍️ Welcome to Aura

Aura is a fast, private markdown editor designed for speed and clarity. This note is your interactive onboarding guide to help you master the editor.

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

Aura supports standard markdown with some powerful enhancements:

### Typography
- **Bold**: \`**text**\`
- *Italic*: \`*text*\`
- ~~Strikethrough~~: \`~~text~~\`
- \`Inline Code\`: \` \`code\` \`
- [Links are easy](https://github.com/bm611/aura)

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
  console.log("Hello from Aura!");
}
\`\`\`

---

## 🏗️ Premium Components

### Interactive Callouts
Aura supports high-visibility callouts for expert organization. 

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

function matchesQuery(query, values) {
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
function ensureDailyFolder(tree) {
  const allNotes = flattenTree(tree)
  const dailyNotes = allNotes.filter(n => n.tags?.includes('daily'))

  const recursiveFilter = (nodes) => {
    return nodes
      .filter(n => {
        if (n.type === 'file' && n.tags?.includes('daily')) return false
        // Cleanup: remove phantom "Daily" notes created by previous folder-sync logic
        if (n.type === 'file' && n.title === 'Daily' && n.name === 'Daily' && (!n.content || n.content.length < 5)) return false
        if (n.type === 'folder' && n.name.toLowerCase() === 'daily') return false
        return true
      })
      .map(n => n.children ? { ...n, children: recursiveFilter(n.children) } : n)
  }

  const otherItems = recursiveFilter(tree)

  if (dailyNotes.length === 0) return otherItems

  const dailyFolder = {
    id: 'folder-daily',
    type: 'folder',
    name: 'Daily',
    title: 'Daily',
    children: dailyNotes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    createdAt: dailyNotes[dailyNotes.length - 1].createdAt,
    updatedAt: dailyNotes[0].updatedAt,
  }

  return [dailyFolder, ...otherItems]
}

function getComparableTimestamp(value) {
  const parsed = Date.parse(value || '')
  return Number.isNaN(parsed) ? 0 : parsed
}

function getNoteChangeTimestamp(note) {
  return Math.max(
    getComparableTimestamp(note?.localCheckpointAt),
    getComparableTimestamp(note?.updatedAt),
    getComparableTimestamp(note?.createdAt)
  )
}

function notesHaveDifferentContent(localNote, cloudNote) {
  return (
    (localNote.title || '') !== (cloudNote.title || '') ||
    (localNote.content || '') !== (cloudNote.content || '') ||
    JSON.stringify(localNote.contentDoc || null) !== JSON.stringify(cloudNote.contentDoc || null) ||
    JSON.stringify(localNote.tags || []) !== JSON.stringify(cloudNote.tags || []) ||
    (localNote.wordGoal || null) !== (cloudNote.wordGoal || null)
  )
}

function shouldPreferLocalNote(localNote, cloudNote) {
  const localChangedAt = getNoteChangeTimestamp(localNote)
  const cloudChangedAt = getNoteChangeTimestamp(cloudNote)
  const lastSyncedAt = getComparableTimestamp(localNote.lastSyncedAt)

  if (lastSyncedAt && localChangedAt > lastSyncedAt) {
    return true
  }

  return notesHaveDifferentContent(localNote, cloudNote) && localChangedAt >= cloudChangedAt
}

function mergeLocalChangesIntoCloud(localTree, cloudNotes) {
  const localNotes = flattenTree(localTree || []).map(normalizeNote)
  const cloudById = new Map(cloudNotes.map(normalizeNote).map((n) => [n.id, n]))
  const localById = new Map(localNotes.map((n) => [n.id, n]))
  const notesToUploadById = new Map()

  // Determine the winning version of each note and track what needs uploading
  const resolvedById = new Map()

  for (const localNote of localNotes) {
    const cloudNote = cloudById.get(localNote.id)

    if (!cloudNote) {
      // Local-only note — needs to be uploaded
      const mergedNote = { ...localNote, syncError: null }
      resolvedById.set(localNote.id, mergedNote)
      notesToUploadById.set(localNote.id, mergedNote)
    } else if (shouldPreferLocalNote(localNote, cloudNote)) {
      // Local is newer — use local content, mark for upload
      const mergedNote = { ...cloudNote, ...localNote, syncError: null }
      resolvedById.set(localNote.id, mergedNote)
      notesToUploadById.set(localNote.id, mergedNote)
    } else {
      // Cloud is newer or equal — use cloud content
      resolvedById.set(localNote.id, { ...cloudNote, syncError: null })
    }
  }

  // Include cloud-only notes (not present in local tree at all)
  const cloudOnlyNotes = []
  for (const cloudNote of cloudById.values()) {
    if (!localById.has(cloudNote.id)) {
      resolvedById.set(cloudNote.id, { ...cloudNote, syncError: null })
      cloudOnlyNotes.push(resolvedById.get(cloudNote.id))
    }
  }

  // Walk localTree preserving folder structure, substituting resolved note content
  const applyResolved = (nodes) => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        return { ...node, children: applyResolved(node.children || []) }
      }
      // file node — replace with resolved version if available
      return resolvedById.get(node.id) ?? node
    })
  }

  const structuredTree = applyResolved(localTree || [])

  // Append cloud-only notes at root level (they have no local folder placement)
  const mergedTree = cloudOnlyNotes.length > 0
    ? [...structuredTree, ...cloudOnlyNotes]
    : structuredTree

  return {
    mergedTree: ensureDailyFolder(mergedTree),
    notesToUpload: Array.from(notesToUploadById.values()),
  }
}

function formatImportedChangesMessage(count, didSyncToCloud) {
  if (count <= 0) {
    return ''
  }

  const label = count === 1 ? 'local note' : 'local notes'
  return didSyncToCloud
    ? `Imported ${count} ${label} from this device and synced to cloud`
    : `Imported ${count} ${label} from this device`
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

function makeSampleTree() {
  const now = new Date().toISOString()
  return [
    {
      id: generateId(),
      type: 'file',
      name: 'Aura Knowledge Base',
      title: 'Aura Knowledge Base',
      content: SAMPLE_NOTE,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function AppInner() {
  const { user } = useAuth()
  const [demoMode, setDemoMode] = useState(false)
  const demoModeRef = useRef(false)

  const [tree, setTree] = useState(() => {
    // On first load, try restoring the authenticated user's tree from cache
    const savedTree = loadTree()
    if (savedTree && savedTree.length > 0) return ensureDailyFolder(savedTree)
    return []
  })

  const notes = flattenTree(tree)

  const [activeNoteId, setActiveNoteId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Start collapsed on mobile
    return window.innerWidth < 768
  })
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('canvas-theme') || 'dark')
  const [fontId, setFontId] = useState(() => localStorage.getItem('canvas-font') || 'outfit')
  const [accentId, setAccentId] = useState(() => localStorage.getItem('canvas-accent') || 'rose')
  const [editorReady, setEditorReady] = useState(false)
  const [deletedNote, setDeletedNote] = useState(null)
  const [focusMode, setFocusMode] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const [failedSyncNoteIds, setFailedSyncNoteIds] = useState([])
  const [isOnline, setIsOnline] = useState(getInitialOnlineState)
  const [syncToast, setSyncToast] = useState(null)
  const deleteTimerRef = useRef(null)
  const cloudSaveTimers = useRef({})
  const syncToastTimerRef = useRef(null)
  const [sbWidth, setSbWidth] = useState(240)
  const editorApiRef = useRef(null)
  const treeRef = useRef(tree)

  const hasPendingCloudSaves = useCallback(() => {
    return Object.values(cloudSaveTimers.current).some(Boolean)
  }, [])

  const finishSyncingIfIdle = useCallback(() => {
    if (!hasPendingCloudSaves()) {
      setSyncing(false)
    }
  }, [hasPendingCloudSaves])

  const showSyncToast = useCallback((message) => {
    setSyncToast(message)
    window.clearTimeout(syncToastTimerRef.current)
    syncToastTimerRef.current = window.setTimeout(() => {
      setSyncToast(null)
      syncToastTimerRef.current = null
    }, 2600)
  }, [])

  const syncNoteToCloud = useCallback(async (noteOrId) => {
    if (!user) {
      return false
    }

    const noteId = typeof noteOrId === 'string' ? noteOrId : noteOrId?.id
    if (!noteId) {
      return false
    }

    if (!navigator.onLine) {
      const message = 'Offline — changes are saved and will retry when online.'
      setSyncError(message)
      setFailedSyncNoteIds((currentIds) => (
        currentIds.includes(noteId) ? currentIds : [...currentIds, noteId]
      ))
      setTree((previousTree) => updateFileNode(previousTree, noteId, { syncError: message }))
      return false
    }

    const note = typeof noteOrId === 'string'
      ? flattenTree(treeRef.current).find((currentNote) => currentNote.id === noteOrId)
      : noteOrId

    if (!note) {
      return false
    }

    try {
      await upsertNote(note, user.id)
      const syncedAt = new Date().toISOString()
      setSyncError(null)
      setFailedSyncNoteIds((currentIds) => currentIds.filter((id) => id !== noteId))
      setTree((previousTree) => updateFileNode(previousTree, noteId, {
        lastSyncedAt: syncedAt,
        syncError: null,
      }))
      return true
    } catch (err) {
      const message = err?.message || 'Sync failed. Changes will retry when possible.'
      setSyncError(message)
      setFailedSyncNoteIds((currentIds) => (
        currentIds.includes(noteId) ? currentIds : [...currentIds, noteId]
      ))
      setTree((previousTree) => updateFileNode(previousTree, noteId, { syncError: message }))
      return false
    }
  }, [user])

  const retryFailedSyncs = useCallback(async () => {
    if (!user || failedSyncNoteIds.length === 0) {
      return
    }

    if (!navigator.onLine) {
      setSyncError('Offline — changes are saved and will retry when online.')
      return
    }

    setSyncing(true)
    let successCount = 0

    for (const noteId of failedSyncNoteIds) {
      window.clearTimeout(cloudSaveTimers.current[noteId])
      cloudSaveTimers.current[noteId] = null

      const didSync = await syncNoteToCloud(noteId)
      if (didSync) {
        successCount += 1
      }
    }

    finishSyncingIfIdle()

    if (successCount === failedSyncNoteIds.length && successCount > 0) {
      showSyncToast('All changes synced')
    }
  }, [failedSyncNoteIds, finishSyncingIfIdle, showSyncToast, syncNoteToCloud, user])

  useEffect(() => {
    treeRef.current = tree
  }, [tree])

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

  useEffect(() => {
    if (!user || !isOnline || failedSyncNoteIds.length === 0) {
      return
    }

    retryFailedSyncs()
  }, [failedSyncNoteIds, isOnline, retryFailedSyncs, user])

  useEffect(() => {
    const timers = cloudSaveTimers.current
    const toastTimer = syncToastTimerRef.current
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) {
          window.clearTimeout(timer)
        }
      })

      window.clearTimeout(toastTimer)
    }
  }, [])

  // ── Cloud sync: load notes when user signs in, revert on sign-out ────────
  useEffect(() => {
    let cancelled = false

    if (!user) {
      setSyncing(false)
      setSyncError(null)
      setFailedSyncNoteIds([])

      // Signed out — clear tree and go back to landing page
      setTree([])
      setDemoMode(false)
      demoModeRef.current = false
      setActiveNoteId(null)
      clearSavedTree()
      return
    }

    // Signed in — advance past landing/demo page automatically
    const wasDemoMode = demoModeRef.current
    setDemoMode(false)
    demoModeRef.current = false
    setAuthModalOpen(false)
    setSyncError(null)

    // Load notes from Supabase
    fetchNotes(user.id)
      .then(async (cloudNotes) => {
        if (cancelled) {
          return
        }

        // Demo notes are ephemeral — don't merge them into cloud
        const localTree = wasDemoMode ? [] : treeRef.current
        const { mergedTree, notesToUpload } = mergeLocalChangesIntoCloud(localTree, cloudNotes)
        const noteIdsToUpload = notesToUpload.map((note) => note.id)
        const importedChangesMessage = formatImportedChangesMessage(noteIdsToUpload.length, false)

        if (!navigator.onLine && noteIdsToUpload.length > 0) {
          const message = 'Offline — changes will sync to cloud when connection returns.'
          const treeWithPendingSync = noteIdsToUpload.reduce(
            (currentTree, noteId) => updateFileNode(currentTree, noteId, { syncError: message }),
            mergedTree
          )

          setTree(treeWithPendingSync)
          setSyncError(message)
          setFailedSyncNoteIds(noteIdsToUpload)
          showSyncToast(`${importedChangesMessage}. Will sync when you're back online.`)
        } else {
          setTree(mergedTree)
          setFailedSyncNoteIds([])
        }

        setActiveNoteId((currentId) => (currentId && findNode(mergedTree, currentId) ? currentId : null))

        if (noteIdsToUpload.length === 0 || !navigator.onLine) {
          return
        }

        setSyncing(true)

        let successCount = 0
        for (const note of notesToUpload) {
          const didSync = await syncNoteToCloud(note)
          if (didSync) {
            successCount += 1
          }
        }

        finishSyncingIfIdle()

        if (successCount > 0 && successCount === notesToUpload.length) {
          showSyncToast(formatImportedChangesMessage(successCount, true))
        } else if (noteIdsToUpload.length > 0) {
          showSyncToast(importedChangesMessage)
        }
      })
      .catch(console.error)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    // Only persist tree to localStorage for authenticated users
    if (user && tree.length > 0) {
      saveTree(tree)
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
    const palette = ACCENT_COLORS.find((a) => a.id === accentId)
    if (palette) {
      const c = theme === 'light' ? palette.light : palette.dark
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

  const createNote = useCallback(
    (overrides = {}, options = {}) => {
      const now = new Date().toISOString()
      const note = normalizeNote({
        id: generateId(),
        type: 'file',
        name: overrides.title || 'Untitled',
        title: overrides.title || '',
        content: '',
        createdAt: now,
        updatedAt: now,
        ...overrides,
      })

      setTree((previousTree) => insertNode(previousTree, null, note))

      // Immediately persist to cloud if signed in
      if (user) {
        setSyncing(true)
        syncNoteToCloud(note).finally(() => {
          finishSyncingIfIdle()
        })
      }

      if (options.activate !== false) {
        setActiveNoteId(note.id)
      }

      return note
    },
    [finishSyncingIfIdle, syncNoteToCloud, user]
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

    const existingNote = notes.find(n => n.title === dateStr && n.tags?.includes('daily'))
    if (existingNote) {
      setActiveNoteId(existingNote.id)
      if (sidebarCollapsed) setSidebarCollapsed(false)
      return
    }

    const template = `
## Journal
- 

## To-Dos
[ ] 

## Ideas & Notes
- 
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
    })

    setTree(prevTree => {
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

  const handleDeleteNote = useCallback(
    (id) => {
      const nodeToDelete = findNode(tree, id)
      if (!nodeToDelete) return

      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }

      const fileIdsToClear = nodeToDelete.type === 'folder'
        ? flattenTree([nodeToDelete]).map((file) => file.id)
        : [nodeToDelete.id]

      fileIdsToClear.forEach((fileId) => {
        window.clearTimeout(cloudSaveTimers.current[fileId])
        cloudSaveTimers.current[fileId] = null
      })

      setFailedSyncNoteIds((currentIds) => (
        currentIds.filter((currentId) => !fileIdsToClear.includes(currentId))
      ))
      finishSyncingIfIdle()

      setTree((previousTree) => deleteNode(previousTree, id))

      // Cloud delete immediately when signed in
      if (user) {
        const filesToDelete = nodeToDelete.type === 'folder'
          ? flattenTree([nodeToDelete])
          : [nodeToDelete]
        filesToDelete.forEach((f) => dbDeleteNote(f.id).catch(console.error))
      }

      if (activeNoteId === id) {
        setActiveNoteId(null)
      } else if (nodeToDelete.type === 'folder') {
        const deletedFiles = flattenTree([nodeToDelete])
        if (deletedFiles.find((f) => f.id === activeNoteId)) {
          setActiveNoteId(null)
        }
      }

      setDeletedNote(nodeToDelete)

      // Auto-dismiss after 5 seconds
      deleteTimerRef.current = setTimeout(() => {
        setDeletedNote(null)
        deleteTimerRef.current = null
      }, 5000)
    },
    [activeNoteId, finishSyncingIfIdle, tree, user]
  )

  const handleUndoDelete = useCallback(() => {
    if (!deletedNote) return
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = null
    }
    setTree((previousTree) => insertNode(previousTree, null, deletedNote))
    setActiveNoteId(deletedNote.id)
    setDeletedNote(null)
  }, [deletedNote])

  const handleUpdateNote = useCallback((id, updates, options = {}) => {
    const now = new Date().toISOString()
    const updatedValues = {
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
      setFailedSyncNoteIds((currentIds) => (
        currentIds.includes(id) ? currentIds : [...currentIds, id]
      ))
      setTree((previousTree) => updateFileNode(previousTree, id, { syncError: message }))
      return
    }

    // Debounced cloud save (1.5s after last keystroke)
    setSyncing(true)
    window.clearTimeout(cloudSaveTimers.current[id])
    cloudSaveTimers.current[id] = window.setTimeout(() => {
      syncNoteToCloud(id).finally(() => {
        cloudSaveTimers.current[id] = null
        finishSyncingIfIdle()
      })
    }, 1500)
  }, [finishSyncingIfIdle, isOnline, syncNoteToCloud, user])

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }, [])

  const toggleFocusMode = useCallback(() => {
    setFocusMode((current) => {
      const next = !current
      if (next) setSidebarCollapsed(true)
      return next
    })
  }, [])

  const onResizeStart = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = sbWidth
    const move = (ev) => setSbWidth(Math.max(160, Math.min(500, startW + ev.clientX - startX)))
    const up = () => {
      window.removeEventListener("mousemove", move)
      window.removeEventListener("mouseup", up)
    }
    window.addEventListener("mousemove", move)
    window.addEventListener("mouseup", up)
  }, [sbWidth])

  // Swipe-from-left-edge to open sidebar
  useEffect(() => {
    let startX = 0
    let startY = 0
    let tracking = false

    const onTouchStart = (e) => {
      const touch = e.touches[0]
      if (touch.clientX < 24 && sidebarCollapsed) {
        startX = touch.clientX
        startY = touch.clientY
        tracking = true
      }
    }

    const onTouchMove = (e) => {
      if (!tracking) return
      const touch = e.touches[0]
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
    const handleKeyDown = (event) => {
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

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFocusMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewNote, openCommandPalette, toggleFocusMode])

  const activeNote = notes.find((note) => note.id === activeNoteId) || null
  const activeNoteSyncFailed = activeNote
    ? failedSyncNoteIds.includes(activeNote.id)
    : failedSyncNoteIds.length > 0

  const activeNoteLastSavedAt = activeNote
    ? (user
      ? activeNote.lastSyncedAt || activeNote.localCheckpointAt
      : activeNote.localCheckpointAt || activeNote.updatedAt)
    : null

  let saveStatus = {
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
        error: activeNote?.syncError || syncError,
        canRetry: true,
      }
    }
  }

  const sidebarSyncStatus = {
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

  // Exit focus mode automatically if there's no active note to write in
  useEffect(() => {
    if (!activeNote && focusMode) {
      setFocusMode(false)
    }
  }, [activeNote, focusMode])

  const paletteNoteResults = searchNotes(notes, commandPaletteQuery).slice(0, 8)
  const paletteCommandResults = editorReady ? getEditorCommands(commandPaletteQuery).slice(0, 6) : []

  const actionItems = [
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
      title: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      subtitle: 'Toggle the editorial theme',
      icon: theme === 'dark' ? <Icon icon={Sun01Icon} size={16} strokeWidth={1.5} /> : <Icon icon={Moon01Icon} size={16} strokeWidth={1.5} />,
      keywords: ['theme', 'color', 'dark', 'light'],
      run: () => toggleTheme(),
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
    {
      id: 'action-focus-mode',
      section: 'Actions',
      title: focusMode ? 'Exit focus mode' : 'Focus mode',
      subtitle: focusMode ? 'Restore the full editor UI' : 'Hide all chrome for distraction-free writing',
      icon: focusMode ? <Icon icon={ArrowExpandIcon} size={16} strokeWidth={1.5} /> : <Icon icon={ArrowShrinkIcon} size={16} strokeWidth={1.5} />,
      keywords: ['focus', 'zen', 'distraction', 'write', 'story', 'fullscreen'],
      run: () => toggleFocusMode(),
    },
  ].filter((item) =>
    matchesQuery(commandPaletteQuery, [item.title, item.subtitle, ...(item.keywords || [])])
  )

  const fontItems = FONT_OPTIONS.filter((option) =>
    matchesQuery(commandPaletteQuery, [option.name, 'font typography'])
  ).map((option) => ({
    id: `font-${option.id}`,
    section: 'Fonts',
    title: option.name,
    subtitle: 'Switch editor typography',
    hint: option.id === fontId ? 'active' : '',
    keywords: ['font', 'type', option.name],
    run: () => setFontId(option.id),
  }))

  const noteItems = paletteNoteResults.map((result) => ({
    id: `note-${result.note.id}`,
    section: 'Notes',
    title: getNoteDisplayTitle(result.note),
    subtitle: result.excerpt,
      icon: <Icon icon={File01Icon} size={16} strokeWidth={1.5} />,
    hint: '',
    keywords: ['note'],
    run: () => setActiveNoteId(result.note.id),
  }))

  const editorItems = paletteCommandResults.map((command) => ({
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

  const exportItems = activeNote ? [
    {
      id: 'action-export-note',
      section: 'Actions',
      title: 'Export note as Markdown',
      subtitle: 'Download the current note as a .md file',
      keywords: ['export', 'download', 'markdown', 'md'],
      run: () => {
        const markdown = activeNote.contentDoc
          ? docToMarkdown(activeNote.contentDoc)
          : (activeNote.content || '')
        const title = activeNote.title?.trim() || 'untitled'
        const fileName = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.md'
        const blob = new Blob([markdown], { type: 'text/markdown' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = fileName; a.click()
        URL.revokeObjectURL(url)
      },
    }
  ] : []

  const allPaletteItems = [...actionItems, ...exportItems, ...fontItems, ...noteItems, ...editorItems]

  const handleStart = useCallback(() => {
    // Enter demo mode with the sample note — nothing is persisted
    setTree(makeSampleTree())
    setDemoMode(true)
    demoModeRef.current = true
  }, [])

  // Show landing page for unauthenticated users who haven't entered demo mode
  if (!user && !demoMode) {
    return (
      <>
        <LandingPage
          onStart={handleStart}
          onSignIn={() => setAuthModalOpen(true)}
        />
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </>
    )
  }

  return (
    <>
      <div className="grain flex h-screen overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)]">
        <Sidebar
          tree={tree}
          setTree={setTree}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onNewNote={createNote}
          onDeleteNote={handleDeleteNote}
          syncing={syncing}
          syncStatus={sidebarSyncStatus}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          searchQuery={sidebarSearch}
          onSearchChange={setSidebarSearch}
          width={sbWidth}
          onResizeStart={onResizeStart}
        />

        <div className={`flex flex-1 min-w-0 transition-[padding] duration-300 ${focusMode ? 'p-0' : 'p-0 md:p-2 md:pl-0'}`}>
          <NoteEditor
            note={activeNote}
            notes={notes}
            onNewNote={handleNewNote}
            onCreateDailyNote={handleCreateDailyNote}
            onUpdateNote={handleUpdateNote}
            onSelectNote={setActiveNoteId}
            onRegisterEditorApi={(api) => {
              editorApiRef.current = api
              setEditorReady(Boolean(api))
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
            accentId={accentId}
            onAccentChange={setAccentId}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
            focusMode={focusMode}
            onToggleFocusMode={toggleFocusMode}
            onOpenCommandPalette={openCommandPalette}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            saveStatus={saveStatus}
            lastSavedAt={activeNoteLastSavedAt}
            onRetrySync={retryFailedSyncs}
          />
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
          <span className="text-sm text-[var(--text-secondary)]">Note deleted</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white transition-all duration-150 hover:brightness-110 active:scale-95"
          >
            Undo
          </button>
        </div>
      )}

      {syncToast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--success)_14%,var(--bg-elevated))] px-4 py-2 text-xs text-[var(--text-primary)]"
          style={{ boxShadow: 'var(--neu-shadow)' }}
        >
          {syncToast}
        </div>
      )}

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  )
}
