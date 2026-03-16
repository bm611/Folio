import { useEffect, useCallback, useRef, useState } from 'react'
import {
  IconArrowsMinimize,
  IconArrowsMaximize,
  IconTerminal2,
  IconSearch,
  IconMoon,
  IconFileText,
  IconSun,
} from '@tabler/icons-react'

import Sidebar, { flattenTree, insertNode, deleteNode, updateFileNode, findNode } from './components/Sidebar'
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

const STORAGE_KEY = 'canvas-notes'
const TREE_STORAGE_KEY = 'canvas-tree'

const FONT_OPTIONS = [
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

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return []
}

function loadTree() {
  try {
    const raw = localStorage.getItem(TREE_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveTree(tree) {
  localStorage.setItem(TREE_STORAGE_KEY, JSON.stringify(tree))
}

const SAMPLE_NOTE = `# Welcome to Aura

> [!note] - Local-First
> Welcome to your local-first markdown workspace. Everything is stored in your browser — no account needed.

This note is a walkthrough of what you can do. Try typing \`/\` on a blank line to open the **slash command menu**, or press \`Cmd+K\` (or \`Ctrl+K\`) to open the **command palette**.

---

## ✍️ Rich Formatting

Aura supports all your favorite markdown formatting. You can write in *italics*, **bold**, ***bold italics***, or ~~strikethrough~~. You can also use \`inline code\`.

Links are easy: [Aura on GitHub](https://github.com/bm611/aura)

## 📋 Organization

Keep things structured with lists and tasks.

### Lists

*   **Unordered lists** for loose items
    *   Like this nested one
*   And another item

1.  **Ordered lists** for steps
2.  Step two
3.  Step three

### Tasks

Stay on top of what you need to do:

- [x] Set up the workspace
- [x] Try the slash commands
- [ ] Add your first real note
- [ ] Explore search

## 💡 Callouts

Draw attention to important information using callouts. Type \`/callout\` to quickly insert one.

> [!tip] - Did you know?
> You can change the editor font and theme! Open the command palette (\`Cmd+K\`) and search for "theme" or "font".

> [!warning] - Important
> Because Aura is local-first, notes are saved to your browser's local storage. Clearing site data will remove them!

## 💻 Code Blocks

Share code with syntax highlighting:

\`\`\`js
function greet(name) {
  return \`Hello, \${name}! Welcome to Aura.\`;
}

console.log(greet("Friend"));
\`\`\`

## 💬 Quotes

> "The best way to predict the future is to invent it." 

---

## 🚀 Getting Started

1. Use the **sidebar** to create a new note.
2. Switch between **Dark Mode** and **Light Mode** using the button in the top right.
3. Try **Focus Mode** for distraction-free writing!
`

function matchesQuery(query, values) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return values.some((value) => value?.toLowerCase().includes(normalizedQuery))
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

function AppInner() {
  const { user } = useAuth()
  const [hasStarted, setHasStartedRaw] = useState(
    () => localStorage.getItem('canvas-started') === 'true' || loadTree()?.length > 0
  )

  const setHasStarted = useCallback((val) => {
    setHasStartedRaw(val)
    if (val) localStorage.setItem('canvas-started', 'true')
  }, [])
  const [tree, setTree] = useState(() => {
    const savedTree = loadTree()
    if (savedTree && savedTree.length > 0) return savedTree

    const savedNotes = loadNotes()
    if (savedNotes.length > 0) {
      return savedNotes.map(n => ({
        ...normalizeNote(n),
        type: 'file',
        name: n.title || 'Untitled'
      }))
    }

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
  const [fontId, setFontId] = useState(() => localStorage.getItem('canvas-font') || 'dm-sans')
  const [editorReady, setEditorReady] = useState(false)
  const [deletedNote, setDeletedNote] = useState(null)
  const [focusMode, setFocusMode] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const deleteTimerRef = useRef(null)
  const cloudSaveTimers = useRef({})

  const [sbWidth, setSbWidth] = useState(240)
  const editorApiRef = useRef(null)

  // ── Cloud sync: load notes when user signs in, revert on sign-out ────────
  useEffect(() => {
    if (!user) {
      // Signed out — revert to localStorage tree
      const savedTree = loadTree()
      if (savedTree && savedTree.length > 0) {
        setTree(savedTree)
      }
      return
    }

    // Signed in — advance past landing page automatically
    setHasStarted(true)
    setAuthModalOpen(false)

    // Load notes from Supabase
    fetchNotes(user.id)
      .then((cloudNotes) => {
        if (cloudNotes.length > 0) {
          setTree(cloudNotes)
          setActiveNoteId(null)
        }
      })
      .catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    saveTree(tree)
  }, [tree])

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
        upsertNote(note, user.id).catch((err) =>
          console.error('[createNote] Supabase upsert failed:', err)
        )
      }

      if (options.activate !== false) {
        setActiveNoteId(note.id)
      }

      if (sidebarCollapsed) {
        setSidebarCollapsed(false)
      }

      return note
    },
    [sidebarCollapsed, user]
  )

  const handleNewNote = useCallback(() => {
    createNote()
  }, [createNote])

  const handleDeleteNote = useCallback(
    (id) => {
      const nodeToDelete = findNode(tree, id)
      if (!nodeToDelete) return

      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }

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
    [activeNoteId, tree, user]
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
    setTree((previousTree) => {
      const updated = { ...updates }
      if (updates.title !== undefined) updated.name = updates.title
      if (!options.skipTimestamp) updated.updatedAt = new Date().toISOString()
      return updateFileNode(previousTree, id, updated)
    })

    // Debounced cloud save (1.5s after last keystroke)
    if (user) {
      setSyncing(true)
      clearTimeout(cloudSaveTimers.current[id])
      cloudSaveTimers.current[id] = setTimeout(() => {
        setTree((currentTree) => {
          const note = flattenTree(currentTree).find(n => n.id === id)
          if (note) {
            upsertNote({ ...note, ...updates }, user.id)
              .catch((err) => console.error('[updateNote] Supabase upsert failed:', err))
              .finally(() => {
                // Only clear syncing if no other timers are pending
                const pending = Object.values(cloudSaveTimers.current).some(Boolean)
                if (!pending) setSyncing(false)
              })
          }
          return currentTree
        })
        cloudSaveTimers.current[id] = null
      }, 1500)
    }
  }, [user])

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
      keywords: ['create', 'note', 'new'],
      run: () => handleNewNote(),
    },
    {
      id: 'action-toggle-theme',
      section: 'Actions',
      title: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      subtitle: 'Toggle the editorial theme',
      icon: theme === 'dark' ? <IconSun size={16} stroke={1.5} /> : <IconMoon size={16} stroke={1.5} />,
      keywords: ['theme', 'color', 'dark', 'light'],
      run: () => toggleTheme(),
    },
    {
      id: 'action-focus-search',
      section: 'Actions',
      title: 'Reveal sidebar search',
      subtitle: 'Open the note index and search surface',
      icon: <IconSearch size={16} stroke={1.5} />,
      keywords: ['search', 'find', 'sidebar'],
      run: () => setSidebarCollapsed(false),
    },
    {
      id: 'action-focus-mode',
      section: 'Actions',
      title: focusMode ? 'Exit focus mode' : 'Focus mode',
      subtitle: focusMode ? 'Restore the full editor UI' : 'Hide all chrome for distraction-free writing',
      icon: focusMode ? <IconArrowsMaximize size={16} stroke={1.5} /> : <IconArrowsMinimize size={16} stroke={1.5} />,
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
    icon: <IconFileText size={16} stroke={1.5} />,
    hint: '',
    keywords: ['note'],
    run: () => setActiveNoteId(result.note.id),
  }))

  const editorItems = paletteCommandResults.map((command) => ({
    id: `editor-${command.id}`,
    section: 'Insert',
    title: command.title,
    subtitle: `Insert /${command.trigger} into the editor`,
    icon: <IconTerminal2 size={16} stroke={1.5} />,
    keywords: command.keywords || [],
    run: () => {
      editorApiRef.current?.focus()
      editorApiRef.current?.runCommand(command.id)
    },
  }))

  const paletteItems = [...actionItems, ...fontItems, ...noteItems, ...editorItems]

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
    setHasStarted(true)
  }, [])

  const handleStartWithNewNote = useCallback(() => {
    setHasStarted(true)
    handleNewNote()
  }, [handleNewNote])

  if (!hasStarted) {
    return (
      <>
        <LandingPage
          onStart={handleStart}
          onCreateNew={handleStartWithNewNote}
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
            onUpdateNote={handleUpdateNote}
            onSelectNote={setActiveNoteId}
            onRegisterEditorApi={(api) => {
              editorApiRef.current = api
              setEditorReady(Boolean(api))
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
            focusMode={focusMode}
            onToggleFocusMode={toggleFocusMode}
            onOpenCommandPalette={openCommandPalette}
            onOpenAuthModal={() => setAuthModalOpen(true)}
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

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  )
}
