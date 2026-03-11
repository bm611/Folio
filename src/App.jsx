import { useEffect, useCallback, useRef, useState } from 'react'
import {
  HiCommandLine,
  HiMagnifyingGlass,
  HiMoon,
  HiOutlineDocumentText,
  HiPlus,
  HiSun,
} from 'react-icons/hi2'

import Sidebar from './components/Sidebar'
import NoteEditor from './components/NoteEditor'
import CommandPalette from './components/CommandPalette'
import LandingPage from './components/LandingPage'
import { getEditorCommands } from './utils/editorCommands'
import { searchNotes } from './utils/knowledgeBase'
import { getNoteDisplayTitle, normalizeNote } from './utils/noteMeta'

const STORAGE_KEY = 'canvas-notes'

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

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

const SAMPLE_NOTE = `> [!NOTE]
> Welcome to your local-first markdown workspace. Everything is stored in your browser — no account needed.

Type \`/\` on a blank line to open **slash commands**, or use the command palette to search notes and run actions.

## Formatting

You can write in *italics*, **bold**, ***bold italics***, or ~~strikethrough~~. Inline \`code\` works too.

Links look like this: [Canvas on GitHub](https://github.com/bm611/aura)

## Lists

Unordered lists:

- First item
- Second item
- Third item

Ordered lists:

1. Step one
2. Step two
3. Step three

## Tasks

- [x] Set up the workspace
- [x] Try the slash commands
- [ ] Add your first real note
- [ ] Explore tags and search

## Callouts

> [!TIP]
> Type \`/callout\` to insert one of these. They support different types like note, tip, warning, and more.

> [!WARNING]
> Notes are saved to your browser's local storage. Clearing site data will remove them.

## Code

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet("Canvas"))
\`\`\`

## Quotes

> The best way to predict the future is to invent it.

---

## Getting Started

1. Create a new note from the sidebar
2. Use tags in the **Details** panel to organize your notes
3. Search across all notes from the sidebar or command palette
`

function matchesQuery(query, values) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return true
  }

  return values.some((value) => value?.toLowerCase().includes(normalizedQuery))
}

export default function App() {
  const [hasStarted, setHasStarted] = useState(false)
  const [notes, setNotes] = useState(() => {
    const saved = loadNotes()
    if (saved.length > 0) {
      return saved.map(normalizeNote)
    }

    const now = new Date().toISOString()
    return [
      {
        id: generateId(),
        title: 'Canvas Knowledge Base',
        content: SAMPLE_NOTE,
        tags: ['canvas', 'knowledge-base'],
        createdAt: now,
        updatedAt: now,
      },
    ]
  })
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Start collapsed on mobile
    return window.innerWidth < 768
  })
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('')
  const [theme, setTheme] = useState(() => localStorage.getItem('canvas-theme') || 'light')
  const [fontId, setFontId] = useState(() => localStorage.getItem('canvas-font') || 'lora')
  const [editorReady, setEditorReady] = useState(false)
  const [deletedNote, setDeletedNote] = useState(null)
  const deleteTimerRef = useRef(null)

  const editorApiRef = useRef(null)

  useEffect(() => {
    saveNotes(notes)
  }, [notes])

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
        title: '',
        content: '',
        tags: [],
        createdAt: now,
        updatedAt: now,
        ...overrides,
      })

      setNotes((previousNotes) => [note, ...previousNotes])

      if (options.activate !== false) {
        setActiveNoteId(note.id)
      }

      if (sidebarCollapsed) {
        setSidebarCollapsed(false)
      }

      return note
    },
    [sidebarCollapsed]
  )

  const handleNewNote = useCallback(() => {
    createNote()
  }, [createNote])

  const handleDeleteNote = useCallback(
    (id) => {
      const noteToDelete = notes.find((note) => note.id === id)
      if (!noteToDelete) return

      // Clear any pending delete
      if (deleteTimerRef.current) {
        clearTimeout(deleteTimerRef.current)
      }

      // Remove from list immediately
      setNotes((previousNotes) => {
        const updatedNotes = previousNotes.filter((note) => note.id !== id)
        if (activeNoteId === id) {
          setActiveNoteId(updatedNotes[0]?.id || null)
        }
        return updatedNotes
      })

      // Store for undo
      setDeletedNote(noteToDelete)

      // Auto-dismiss after 5 seconds
      deleteTimerRef.current = setTimeout(() => {
        setDeletedNote(null)
        deleteTimerRef.current = null
      }, 5000)
    },
    [activeNoteId, notes]
  )

  const handleUndoDelete = useCallback(() => {
    if (!deletedNote) return
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
      deleteTimerRef.current = null
    }
    setNotes((previousNotes) => [deletedNote, ...previousNotes])
    setActiveNoteId(deletedNote.id)
    setDeletedNote(null)
  }, [deletedNote])

  const handleUpdateNote = useCallback((id, updates) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) => {
        if (note.id === id) {
          return { ...note, ...updates, updatedAt: new Date().toISOString() }
        }

        return note
      })
    )
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }, [])

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
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNewNote, openCommandPalette])

  const activeNote = notes.find((note) => note.id === activeNoteId) || null
  const sidebarResults = sidebarSearch.trim() ? searchNotes(notes, sidebarSearch) : searchNotes(notes, '')
  const paletteNoteResults = searchNotes(notes, commandPaletteQuery).slice(0, 8)
  const paletteCommandResults = editorReady ? getEditorCommands(commandPaletteQuery).slice(0, 6) : []

  const actionItems = [
    {
      id: 'action-new-note',
      section: 'Actions',
      title: 'New note',
      subtitle: 'Create a blank note',
      icon: <HiPlus size={16} />,
      keywords: ['create', 'note', 'new'],
      run: () => handleNewNote(),
    },
    {
      id: 'action-toggle-theme',
      section: 'Actions',
      title: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
      subtitle: 'Toggle the editorial theme',
      icon: theme === 'dark' ? <HiSun size={16} /> : <HiMoon size={16} />,
      keywords: ['theme', 'color', 'dark', 'light'],
      run: () => toggleTheme(),
    },
    {
      id: 'action-focus-search',
      section: 'Actions',
      title: 'Reveal sidebar search',
      subtitle: 'Open the note index and search surface',
      icon: <HiMagnifyingGlass size={16} />,
      keywords: ['search', 'find', 'sidebar'],
      run: () => setSidebarCollapsed(false),
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
    icon: <HiOutlineDocumentText size={16} />,
    hint: '',
    keywords: ['note', ...(result.note.tags || [])],
    run: () => setActiveNoteId(result.note.id),
  }))

  const editorItems = paletteCommandResults.map((command) => ({
    id: `editor-${command.id}`,
    section: 'Insert',
    title: command.title,
    subtitle: `Insert /${command.trigger} into the editor`,
    icon: <HiCommandLine size={16} />,
    keywords: command.keywords || [],
    run: () => {
      editorApiRef.current?.focus()
      editorApiRef.current?.runCommand(command.id)
    },
  }))

  const paletteItems = [...actionItems, ...fontItems, ...noteItems, ...editorItems]

  const handleStart = useCallback(() => {
    setHasStarted(true)
  }, [])

  if (!hasStarted) {
    return <LandingPage onStart={handleStart} />
  }

  return (
    <>
      <div className="grain flex h-screen overflow-hidden bg-[var(--bg-deep)] text-[var(--text-primary)]">
        <Sidebar
          notes={sidebarResults}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onNewNote={handleNewNote}
          onDeleteNote={handleDeleteNote}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
          searchQuery={sidebarSearch}
          onSearchChange={setSidebarSearch}
        />

        <div className="flex flex-1 min-w-0 p-2 pl-0">
          <NoteEditor
            note={activeNote}
            notes={notes}
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
          />
        </div>
      </div>

      <CommandPalette
        key={commandPaletteOpen ? 'palette-open' : 'palette-closed'}
        open={commandPaletteOpen}
        query={commandPaletteQuery}
        items={paletteItems}
        onClose={closeCommandPalette}
        onQueryChange={setCommandPaletteQuery}
        onSelectItem={(item) => {
          item.run()
          closeCommandPalette()
        }}
      />

      {deletedNote && (
        <div
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 shadow-lg"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <span className="text-sm text-[var(--text-secondary)]">Note deleted</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            Undo
          </button>
        </div>
      )}
    </>
  )
}
