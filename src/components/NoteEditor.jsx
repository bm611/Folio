import { lazy, Suspense, useState, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  IconArrowsMinimize,
  IconArrowsMaximize,
  IconCalendar,
  IconMoon,
  IconSun,
  IconLayoutSidebarFilled,
  IconCommand,
  IconPlus,
  IconDownload,
  IconLogout,
  IconUser,
} from '@tabler/icons-react'
import { countBodyWords, estimateReadTime, formatCreatedAt, getNoteDisplayTitle } from '../utils/noteMeta'
import { docToMarkdown } from '../editor/markdown/markdownConversion'
import TagInput from './TagInput'

const LiveMarkdownEditor = lazy(() => import('./LiveMarkdownEditor'))

function exportNoteAsMarkdown(note) {
  const markdown = note.contentDoc
    ? docToMarkdown(note.contentDoc)
    : (note.content || '')
  const title = note.title?.trim() || 'untitled'
  const fileName = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '.md'
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

function EditorFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]">
      Loading...
    </div>
  )
}

function getGradientForNote(id) {
  // Simple deterministic hash of the ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Color palette for gradients
  const colors = [
    'var(--accent)',
    '#5e9fb8',
    '#aba1c4',
    '#d17b88',
    '#7eb5cc',
    '#c5bce0',
    '#e895a2'
  ];

  const color1 = colors[Math.abs(hash) % colors.length];
  const color2 = colors[Math.abs(hash * 31) % colors.length];

  return `radial-gradient(ellipse at top left, color-mix(in srgb, ${color1} 15%, transparent) 0%, transparent 50%),
          radial-gradient(ellipse at top right, color-mix(in srgb, ${color2} 15%, transparent) 0%, transparent 50%)`;
}

export default function NoteEditor({
  note,
  notes,
  onNewNote,
  onUpdateNote,
  onSelectNote,
  onRegisterEditorApi,
  theme,
  onToggleTheme,
  sidebarCollapsed,
  onToggleSidebar,
  focusMode,
  onToggleFocusMode,
  onOpenCommandPalette,
  onOpenAuthModal,
}) {
  const { user, signOut } = useAuth()
  const [showGoalInput, setShowGoalInput] = useState(false)
  const [goalInputVal, setGoalInputVal] = useState('')

  // Prevents double-fire when Enter triggers both keydown and blur
  const goalCommittedRef = useRef(false)

  // Session word count: capture baseline when a note is first opened
  const sessionBaseRef = useRef(null)
  const prevNoteIdRef = useRef(null)

  // Keeps a local reference to the editor API so the title input can focus it
  const editorApiRef = useRef(null)

  const handleRegisterEditorApi = useCallback(
    (api) => {
      editorApiRef.current = api
      onRegisterEditorApi?.(api)
    },
    [onRegisterEditorApi]
  )

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      editorApiRef.current?.focus()
    }
  }

  if (!note) {
    const today = new Date()
    const hour = today.getHours()
    let greeting = 'Good evening'
    if (hour < 12) greeting = 'Good morning'
    else if (hour < 18) greeting = 'Good afternoon'

    const dateStr = today.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const recentNotes = [...(notes || [])]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 6)

    return (
      <div className="flex flex-1 min-w-0 flex-col max-md:rounded-none rounded-2xl bg-[var(--bg-primary)]">
        {/* Top bar — hidden on mobile (actions are in bottom bar) */}
        <div className="hidden md:flex items-center justify-between px-4 py-2 md:px-6">
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="neu-icon-btn flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--text-primary)]"
              title="Open sidebar (Cmd+B)"
            >
              <IconLayoutSidebarFilled size={18} stroke={1.5} style={{ transform: "scaleX(-1)" }} />
            </button>
          ) : (
            <div className="w-10" />
          )}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleTheme}
              className="neu-icon-btn flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--text-primary)]"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <IconSun size={18} stroke={1.5} /> : <IconMoon size={18} stroke={1.5} />}
            </button>
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="neu-icon-btn flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-red-400"
                title={`Signed in as ${user.email} — click to sign out`}
              >
                <IconLogout size={18} stroke={1.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="neu-icon-btn flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--accent)]"
                title="Sign in to sync"
              >
                <IconUser size={18} stroke={1.5} />
              </button>
            )}
          </div>
        </div>

        {/* Welcome content */}
        <div className="flex flex-1 flex-col items-center px-6 pt-[12vh] md:pt-[5vh] pb-24 md:pb-6 overflow-y-auto">
          <div className="animate-fade-in-up flex flex-col items-center">
            <h1
              className="text-6xl tracking-tight text-[var(--h1-color)] sm:text-7xl"
              style={{ fontFamily: '"Italiana", serif', textShadow: '0 4px 24px var(--accent-muted)' }}
            >
              Aura.
            </h1>
            <p
              className="mt-4 text-[16px] text-[var(--text-muted)] tracking-wide"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {greeting}. It's {dateStr}.
            </p>
          </div>

          <div className="animate-fade-in-up-delay-2 mt-8 mb-2 flex flex-col items-center gap-3">
            <button
              onClick={() => onNewNote?.()}
              className="neu-btn-primary group relative inline-flex items-center gap-2.5 rounded-full bg-[var(--accent)] px-8 py-4 text-[15px] font-semibold text-white transition-all duration-300 hover:translate-y-[2px] hover:shadow-[0_0_20px_rgba(209,123,136,0.3)] active:translate-y-[6px]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <IconPlus size={18} stroke={2} className="transition-transform duration-300 group-hover:rotate-90" />
              <span>Create New Note</span>
            </button>
            <span className="text-[11px] font-medium tracking-wider text-[var(--text-muted)] opacity-60">
              PRESS <kbd className="font-sans px-1.5 py-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[9px] mx-1">⌘N</kbd> ANYTIME
            </span>
          </div>

          {recentNotes.length > 0 && (
            <div className="animate-fade-in-up-delay-2 mt-12 w-full max-w-3xl">
              <div className="mb-6 flex items-center justify-center gap-4">
                 <div className="h-px w-12 bg-[var(--border-subtle)]"></div>
                 <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                   Recent Notes
                 </p>
                 <div className="h-px w-12 bg-[var(--border-subtle)]"></div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentNotes.map((n, index) => {
                  const title = getNoteDisplayTitle(n)
                  const preview = (n.content || '').replace(/[#*>`\-\[\]()!_~]/g, '').trim().slice(0, 80)
                  const time = new Date(n.updatedAt || n.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onSelectNote(n.id)}
                      className={`neu-card group flex flex-col gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-left transition-all duration-300 hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent-muted)] hover:-translate-y-1 active:translate-y-1 ${index >= 2 ? 'hidden sm:flex' : ''}`}
                    >
                      <span
                        className="truncate text-[14px] font-semibold text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--accent)]"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {title}
                      </span>
                      {preview && (
                        <span
                          className="line-clamp-2 text-[13px] leading-relaxed text-[var(--text-muted)]"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {preview}
                        </span>
                      )}
                      <span
                        className="mt-auto text-[11px] font-medium text-[var(--text-muted)] opacity-80"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {time}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        {/* Mobile action bar */}
        <div className="mobile-action-bar" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="mobile-action-bar-inner">
            <button type="button" onClick={onToggleSidebar}>
              <IconLayoutSidebarFilled size={18} stroke={1.5} />
            </button>
            <button type="button" onClick={() => onNewNote?.()}>
              <IconPlus size={18} stroke={1.5} />
            </button>
            {onOpenCommandPalette && (
              <button type="button" onClick={onOpenCommandPalette}>
                <IconCommand size={18} stroke={1.5} />
              </button>
            )}
            <button type="button" onClick={onToggleTheme}>
              {theme === 'dark' ? <IconSun size={18} stroke={1.5} /> : <IconMoon size={18} stroke={1.5} />}
            </button>
            {user ? (
              <button type="button" onClick={signOut} title="Sign out">
                <IconLogout size={18} stroke={1.5} />
              </button>
            ) : (
              <button type="button" onClick={onOpenAuthModal} title="Sign in to sync">
                <IconUser size={18} stroke={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const createdAtLabel = formatCreatedAt(note.createdAt)
  const wordCount = countBodyWords(note.content)
  const readTime = estimateReadTime(note.content)
  const wordGoal = note.wordGoal || null
  const goalProgress = wordGoal ? Math.min(100, Math.round((wordCount / wordGoal) * 100)) : null

  // Session baseline: reset whenever the open note changes
  if (note.id !== prevNoteIdRef.current) {
    prevNoteIdRef.current = note.id
    sessionBaseRef.current = wordCount
  }
  const sessionDelta = wordCount - (sessionBaseRef.current ?? wordCount)

  // ── Goal handlers ────────────────────────────────────────────────────────────

  const openGoalInput = () => {
    goalCommittedRef.current = false
    setGoalInputVal(wordGoal !== null ? String(wordGoal) : '')
    setShowGoalInput(true)
  }

  const commitGoal = (value) => {
    if (goalCommittedRef.current) return
    goalCommittedRef.current = true
    const val = parseInt(value.trim(), 10)
    if (!isNaN(val) && val > 0) {
      onUpdateNote(note.id, { wordGoal: val }, { skipTimestamp: true })
    } else {
      onUpdateNote(note.id, { wordGoal: null }, { skipTimestamp: true })
    }
    setShowGoalInput(false)
    setGoalInputVal('')
  }

  const handleGoalKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitGoal(goalInputVal)
    } else if (e.key === 'Escape') {
      goalCommittedRef.current = true // suppress blur commit
      setShowGoalInput(false)
      setGoalInputVal('')
    }
  }

  const handleGoalBlur = () => {
    commitGoal(goalInputVal)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={`relative flex flex-1 flex-col min-h-0 min-w-0 w-full bg-[var(--bg-primary)] transition-[border-radius] duration-300 overflow-hidden ${
        focusMode ? 'rounded-none' : 'max-md:rounded-none rounded-2xl'
      }`}
    >
      {/* Subtle grainy gradient background for the banner area */}
      {!focusMode && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-[35vh] opacity-100 transition-colors duration-700 z-0"
          style={{
            backgroundImage: getGradientForNote(note.id),
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
          }}
        />
      )}

      {/* Zen mode exit button — floats in the top-right corner */}
      {focusMode && (
        <button
          type="button"
          onClick={onToggleFocusMode}
          className="absolute top-3 right-3 z-50 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 opacity-20 transition-all hover:opacity-80 hover:bg-[var(--bg-hover)] select-none"
          style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--text-muted)', fontSize: '11px' }}
          title="Exit focus mode (⌘⇧F)"
        >
          <IconArrowsMaximize size={12} stroke={1.5} />
          <span>Exit</span>
        </button>
      )}

      {/* Top bar — hidden in focus mode */}
      {!focusMode && (
        <div className="flex items-center justify-between px-4 py-2 md:px-6 relative z-10">
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="neu-icon-btn hidden md:flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--text-primary)]"
              title="Open sidebar (Cmd+B)"
            >
              <IconLayoutSidebarFilled size={18} stroke={1.5} style={{ transform: "scaleX(-1)" }} />
            </button>
          ) : (
            <div className="hidden md:block w-10" />
          )}
          <div className="flex items-center gap-1 max-md:ml-auto">
            {note && (
              <button
                type="button"
                onClick={() => exportNoteAsMarkdown(note)}
                className="neu-icon-btn hidden md:flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--text-primary)]"
                title="Export as Markdown"
              >
                <IconDownload size={18} stroke={1.5} />
              </button>
            )}
            <button
              type="button"
              onClick={onToggleFocusMode}
              className="neu-icon-btn hidden md:flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--text-primary)]"
              title="Focus mode (⌘⇧F)"
            >
              <IconArrowsMinimize size={18} stroke={1.5} />
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              className="neu-icon-btn hidden md:flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--text-primary)]"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <IconSun size={18} stroke={1.5} /> : <IconMoon size={18} stroke={1.5} />}
            </button>
            {/* Auth: show sign-in or user avatar+signout */}
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="neu-icon-btn hidden md:flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-red-400"
                title={`Signed in as ${user.email} — click to sign out`}
              >
                <IconLogout size={18} stroke={1.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="neu-icon-btn hidden md:flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-muted)] transition-all duration-200 hover:text-[var(--accent)]"
                title="Sign in to sync"
              >
                <IconUser size={18} stroke={1.5} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10">
        <div
          className={`mx-auto max-w-3xl px-4 pb-44 md:pb-32 sm:px-6 md:px-10 ${
            focusMode ? 'pt-[12vh]' : 'pt-6 md:pt-0'
          }`}
        >
          {/* Title — hidden in focus mode */}
          {!focusMode && (
            <input
              type="text"
              value={note.title}
              onChange={(event) => onUpdateNote(note.id, { title: event.target.value })}
              onKeyDown={handleTitleKeyDown}
              className="note-title-input w-full bg-transparent text-3xl font-black tracking-tight text-[var(--title-color)] outline-none placeholder:text-[var(--text-muted)] md:text-5xl"
              style={{ fontFamily: "'Fraunces', serif" }}
              placeholder="Untitled"
            />
          )}

          {/* Metadata — hidden in focus mode */}
          {!focusMode && (
            <div
              className="mt-3 text-[12px] text-[var(--text-muted)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <IconCalendar size={14} stroke={1.5} className="opacity-70" />
                {createdAtLabel}
              </span>

            </div>
          )}

          {/* Tags — hidden in focus mode */}
          {!focusMode && (
            <div className="mt-3">
              <TagInput
                tags={note.tags || []}
                onChange={(tags) => onUpdateNote(note.id, { tags }, { skipTimestamp: true })}
              />
            </div>
          )}

          {/* Editor */}
          <div className={focusMode ? 'mt-0' : 'mt-8'}>
            <Suspense fallback={<EditorFallback />}>
              <LiveMarkdownEditor
                key={note.id}
                value={note.content}
                contentDoc={note.contentDoc}
                onChange={(updates) => onUpdateNote(note.id, updates)}
                onRegisterEditorApi={onRegisterEditorApi}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Stats bar — bottom right */}
      <div
        className="absolute bottom-0 right-0 left-0 md:left-auto flex flex-col items-center md:items-end gap-1.5 px-4 py-3 md:py-3 md:px-5 md:bottom-5 md:right-5 bg-gradient-to-t from-[var(--bg-primary)] to-transparent md:bg-none md:bg-[var(--bg-elevated)]/60 md:backdrop-blur-md md:rounded-2xl md:border border-[var(--border-subtle)] md:shadow-lg transition-all duration-500 z-20"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Word goal progress bar */}
        {wordGoal !== null && !showGoalInput && (
          <div className="flex items-center gap-2">
            <div className="h-[3px] w-28 overflow-hidden rounded-full bg-[var(--border-subtle)]">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${goalProgress}%`,
                  background: goalProgress >= 100 ? 'var(--success)' : 'var(--accent)',
                }}
              />
            </div>
          </div>
        )}

        {/* Inline goal input */}
        {showGoalInput && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)]">Word goal:</span>
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              type="number"
              min="1"
              value={goalInputVal}
              onChange={(e) => setGoalInputVal(e.target.value)}
              onKeyDown={handleGoalKeyDown}
              onBlur={handleGoalBlur}
              placeholder="e.g. 5000"
              className="w-20 rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] tabular-nums"
            />
          </div>
        )}

        {/* Stats line */}
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] tabular-nums select-none">
          {/* Session delta */}
          {sessionDelta > 0 && (
            <>
              <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                +{sessionDelta.toLocaleString()}
              </span>
              <span className="opacity-40">·</span>
            </>
          )}

          {/* Word count / goal */}
          {wordGoal !== null ? (
            <span>
              {wordCount.toLocaleString()}&thinsp;/&thinsp;{wordGoal.toLocaleString()}
              <span className="ml-1 opacity-60">({goalProgress}%)</span>
            </span>
          ) : (
            <span>{new Intl.NumberFormat().format(wordCount)} words</span>
          )}

          {/* Reading time */}
          {readTime && (
            <>
              <span className="opacity-40">·</span>
              <span>{readTime}</span>
            </>
          )}

          {/* Goal toggle — hidden in focus mode */}
          {!focusMode && (
            <>
              <span className="opacity-40">·</span>
              <button
                type="button"
                onClick={openGoalInput}
                className="transition-colors hover:text-[var(--accent)]"
                title={wordGoal ? 'Edit word goal' : 'Set a word goal'}
              >
                {wordGoal ? 'goal' : 'set goal'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile action bar — floating liquid glass */}
      {!focusMode && (
        <div className="mobile-action-bar" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="mobile-action-bar-inner">
            <button type="button" onClick={onToggleSidebar}>
              <IconLayoutSidebarFilled size={18} stroke={1.5} />
            </button>
            <button type="button" onClick={() => onNewNote?.()}>
              <IconPlus size={18} stroke={1.5} />
            </button>
            {onOpenCommandPalette && (
              <button type="button" onClick={onOpenCommandPalette}>
                <IconCommand size={18} stroke={1.5} />
              </button>
            )}
            <button type="button" onClick={onToggleTheme}>
              {theme === 'dark' ? <IconSun size={18} stroke={1.5} /> : <IconMoon size={18} stroke={1.5} />}
            </button>
            {user ? (
              <button type="button" onClick={signOut} title="Sign out">
                <IconLogout size={18} stroke={1.5} />
              </button>
            ) : (
              <button type="button" onClick={onOpenAuthModal} title="Sign in to sync">
                <IconUser size={18} stroke={1.5} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
