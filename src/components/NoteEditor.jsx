import { lazy, Suspense, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowShrinkIcon,
  ArrowExpandIcon,
  AlertCircleIcon,
  Calendar01Icon,
  CloudSavingDone01Icon,
  CloudOffIcon,
  FloppyDiskIcon,
  Loading01Icon,
  Moon01Icon,
  Sun01Icon,
  SidebarLeftIcon,
  CommandIcon,
  Add01Icon,
  Download01Icon,
  Logout01Icon,
  CloudUploadIcon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons'
import Icon from './Icon'
import { countBodyWords, estimateReadTime, formatCreatedAt, getNoteDisplayTitle } from '../utils/noteMeta'
import { docToMarkdown } from '../editor/markdown/markdownConversion'
import TagInput from './TagInput'
import DailyHeader from './DailyHeader'
import AccentPicker from './AccentPicker'

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

// ── First-note empty state ───────────────────────────────────────────────────
function FirstNotePrompt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
      className="mt-10 flex flex-col items-center gap-6 select-none"
    >
      {/* Animated illustration */}
      <div className="relative w-48 h-44">
        <svg
          viewBox="0 0 192 176"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-hidden="true"
        >
          {/* Glow backdrop */}
          <motion.ellipse
            cx="96" cy="110" rx="64" ry="18"
            fill="var(--accent)"
            initial={{ opacity: 0, scaleX: 0.4 }}
            animate={{ opacity: [0.06, 0.12, 0.06], scaleX: [0.8, 1, 0.8] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Back paper — tilted left */}
          <motion.g
            initial={{ opacity: 0, y: 14, rotate: -10 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
            style={{ transformOrigin: '96px 95px' }}
          >
            <motion.rect
              x="44" y="30" width="88" height="112" rx="10"
              fill="var(--bg-elevated)"
              stroke="var(--border-subtle)"
              strokeWidth="1.2"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />
            {/* Lines on back paper */}
            {[55, 68, 81, 94].map((y, i) => (
              <motion.line
                key={y} x1="58" y1={y} x2="118" y2={y}
                stroke="var(--border-subtle)" strokeWidth="1.5" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + i * 0.08 }}
              />
            ))}
          </motion.g>

          {/* Front paper — slight right tilt */}
          <motion.g
            initial={{ opacity: 0, y: 20, rotate: 8 }}
            animate={{ opacity: 1, y: 0, rotate: 4 }}
            transition={{ duration: 0.65, delay: 0.55, ease: [0.25, 1, 0.5, 1] }}
            style={{ transformOrigin: '96px 95px' }}
          >
            <motion.rect
              x="52" y="22" width="88" height="112" rx="10"
              fill="var(--bg-surface)"
              stroke="var(--border-default)"
              strokeWidth="1.2"
              animate={{ y: [0, -5, 0], rotate: [4, 5.5, 4] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '96px 78px' }}
            />
            {/* Accent top bar */}
            <motion.rect
              x="52" y="22" width="88" height="22" rx="10"
              fill="var(--accent)"
              opacity="0.18"
              animate={{ opacity: [0.18, 0.28, 0.18] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
            {/* Pen/cursor icon on front paper */}
            <motion.g
              animate={{ y: [0, -2, 0], rotate: [0, 3, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              style={{ transformOrigin: '96px 70px' }}
            >
              {/* Pen body */}
              <motion.path
                d="M89 62 L103 48 L111 56 L97 70 Z"
                fill="var(--accent)"
                opacity="0.9"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.9 }}
                transition={{ duration: 0.4, delay: 1 }}
                style={{ transformOrigin: '100px 59px' }}
              />
              {/* Pen tip */}
              <motion.path
                d="M97 70 L93 74 L96 71 Z"
                fill="var(--accent)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              />
              {/* Pen highlight */}
              <motion.line
                x1="92" y1="66" x2="100" y2="58"
                stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 1.1 }}
              />
            </motion.g>
            {/* Placeholder lines */}
            {[90, 103, 116].map((y, i) => (
              <motion.line
                key={y} x1="66" y1={y} x2={i === 2 ? '110' : '126'} y2={y}
                stroke="var(--border-subtle)" strokeWidth="1.5" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.9 + i * 0.1 }}
              />
            ))}
          </motion.g>

          {/* Orbiting sparkle ring */}
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '96px 78px' }}
          >
            {[0, 72, 144, 216, 288].map((deg, i) => {
              const rad = (deg * Math.PI) / 180
              const r = 66
              const cx = 96 + r * Math.cos(rad)
              const cy = 78 + r * Math.sin(rad)
              return (
                <motion.circle
                  key={deg} cx={cx} cy={cy} r={i % 2 === 0 ? 2.5 : 1.5}
                  fill={i % 2 === 0 ? 'var(--accent)' : 'var(--color-h2)'}
                  animate={{ opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                  style={{ transformOrigin: `${cx}px ${cy}px` }}
                />
              )
            })}
          </motion.g>

          {/* Floating ink drops */}
          {[
            { x: 32, y: 44, delay: 0.8, color: 'var(--accent)' },
            { x: 158, y: 58, delay: 1.4, color: 'var(--color-h2)' },
            { x: 148, y: 128, delay: 2.1, color: 'var(--success)' },
          ].map(({ x, y, delay, color }, i) => (
            <motion.circle
              key={i} cx={x} cy={y} r="3.5" fill={color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0, 1, 0], y: [0, -12, -20] }}
              transition={{ duration: 2.8, delay, repeat: Infinity, repeatDelay: 2, ease: 'easeOut' }}
            />
          ))}
        </svg>
      </div>

      {/* Text */}
      <motion.div
        className="flex flex-col items-center gap-2 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <p
          className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Your canvas is empty.
        </p>
        <p
          className="text-[14px] text-[var(--text-muted)] max-w-[240px] leading-relaxed"
        >
          Every great idea starts somewhere. Write your first note.
        </p>
      </motion.div>
    </motion.div>
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
    'var(--success)',
    'var(--color-h2)',
    'var(--accent)',
    'var(--success)',
    'var(--color-h2)',
    'var(--accent-hover)'
  ];

  const color1 = colors[Math.abs(hash) % colors.length];
  const color2 = colors[Math.abs(hash * 31) % colors.length];

  return `radial-gradient(ellipse at top left, color-mix(in srgb, ${color1} 15%, transparent) 0%, transparent 50%),
          radial-gradient(ellipse at top right, color-mix(in srgb, ${color2} 15%, transparent) 0%, transparent 50%)`;
}

function formatRelativeSaveTime(timestamp) {
  if (!timestamp) {
    return null
  }

  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const diffSeconds = Math.max(0, Math.round((Date.now() - parsed.getTime()) / 1000))

  if (diffSeconds < 5) {
    return 'just now'
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

function getSaveBadgeMeta(saveStatus) {
  switch (saveStatus?.state) {
    case 'syncing':
      return {
        icon: Loading01Icon,
        toneClassName: 'text-[var(--success)] border-[color-mix(in_srgb,var(--success)_26%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)]',
        spin: true,
      }
    case 'saved':
      return {
        icon: CloudSavingDone01Icon,
        toneClassName: 'text-[var(--success)] border-[color-mix(in_srgb,var(--success)_26%,transparent)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)]',
        spin: false,
      }
    case 'offline':
      return {
        icon: CloudOffIcon,
        toneClassName: 'text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_28%,transparent)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)]',
        spin: false,
      }
    case 'error':
      return {
        icon: AlertCircleIcon,
        toneClassName: 'text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]',
        spin: false,
      }
    default:
      return {
        icon: FloppyDiskIcon,
        toneClassName: 'text-[var(--text-muted)] border-[color-mix(in_srgb,var(--text-muted)_24%,transparent)] bg-[color-mix(in_srgb,var(--text-muted)_10%,transparent)]',
        spin: false,
      }
  }
}

export default function NoteEditor({
  note,
  notes,
  onNewNote,
  onCreateDailyNote,
  onUpdateNote,
  onSelectNote,
  onRegisterEditorApi,
  theme,
  onToggleTheme,
  accentId,
  onAccentChange,
  sidebarCollapsed,
  onToggleSidebar,
  focusMode,
  onToggleFocusMode,
  onOpenCommandPalette,
  onOpenAuthModal,
  saveStatus,
  lastSavedAt,
  onRetrySync,
}) {
  const { user, signOut } = useAuth()


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
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 md:px-6">
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.97]"
              title="Open sidebar (Cmd+B)"
            >
              <Icon icon={SidebarLeftIcon} size={18} strokeWidth={1.5} style={{ transform: "scaleX(-1)" }} />
            </button>
          ) : (
            <div className="hidden md:block w-10" />
          )}
          <div className="ml-auto flex items-center gap-1">
            <AccentPicker accentId={accentId} onAccentChange={onAccentChange} theme={theme} />
            <button
              type="button"
              onClick={onToggleTheme}
              className="hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.97]"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Icon icon={Sun01Icon} size={18} strokeWidth={1.5} /> : <Icon icon={Moon01Icon} size={18} strokeWidth={1.5} />}
            </button>
            {user ? (
              <div className="auth-group">
                <div className="auth-pill auth-pill--signed-in" title={`Signed in as ${user.email}`}>
                  <span className="auth-pill__avatar">{user.email?.[0]?.toUpperCase() || '?'}</span>
                  <span className="auth-pill__dot" />
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="auth-signout-btn"
                  title="Sign out"
                >
                  <Icon icon={Logout01Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="auth-pill auth-pill--signed-out"
                title="Sign in to sync your notes"
              >
                <Icon icon={CloudUploadIcon} size={14} strokeWidth={2} />
                <span>Sign in</span>
              </button>
            )}
          </div>
        </div>

        {/* Welcome content */}
        <div className="flex flex-1 flex-col items-center px-6 pt-[12vh] md:pt-[5vh] pb-24 md:pb-6 overflow-y-auto">
          <div className="animate-fade-in-up flex flex-col items-center">
            <h1
              className="text-6xl tracking-tight text-[var(--h1-color)] sm:text-7xl"
              style={{ fontFamily: 'var(--font-logo)', textShadow: '0 4px 24px var(--accent-muted)' }}
            >
              Aura.
            </h1>
            <p
              className="mt-4 text-[16px] text-[var(--text-muted)] tracking-wide"
            >
              {greeting}. It's {dateStr}.
            </p>
          </div>

          <div className="animate-fade-in-up-delay-2 mt-8 mb-2 flex items-center justify-center w-full max-w-md">
            <div className="flex items-center gap-2 w-full justify-center px-2 sm:px-0">
              <button
                onClick={() => onNewNote?.()}
                className="neu-btn-primary group relative flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] border border-transparent px-3 py-3 text-[13px] font-semibold text-white shadow-[0_0_30px_var(--accent)]/35 transition-all duration-300 hover:brightness-125 hover:shadow-[0_0_50px_var(--accent)]/60 active:scale-[0.98] sm:px-6 sm:text-[14px]"
              >
                <Icon
                  icon={Add01Icon}
                  size={16}
                  strokeWidth={2.5}
                  className="shrink-0 transition-transform duration-300 group-hover:rotate-90"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))' }}
                />
                <span className="truncate">New Note</span>
              </button>
              <button
                onClick={() => onCreateDailyNote?.()}
                className="group relative flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--bg-surface)]/40 backdrop-blur-md border border-[var(--border-subtle)] px-3 py-3 text-[13px] font-semibold text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[var(--bg-surface)]/60 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] active:scale-[0.98] sm:px-6 sm:text-[14px]"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--accent)]/10 text-[var(--accent)] transition-transform duration-300 group-hover:-translate-y-0.5">
                  <Icon icon={Calendar01Icon} size={14} strokeWidth={2} />
                </div>
                <span className="truncate">Daily Note</span>
              </button>
            </div>
          </div>

          {recentNotes.length > 0 ? (
            <div className="animate-fade-in-up-delay-2 mt-10 w-full max-w-2xl md:mt-16" style={{ fontFamily: '"Outfit", sans-serif' }}>
              <div className="mb-2 flex items-baseline gap-3 pb-2 md:mb-4">
                <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">Recent</h2>
                <span className="text-2xl font-light text-[var(--text-muted)] md:text-4xl">{recentNotes.length}</span>
              </div>
              <div className="mb-2 flex items-center gap-6 border-b border-[var(--border-subtle)] px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-60 md:mb-4 md:gap-12">
                 <div className="w-20 md:w-24">/ Date</div>
                 <div>/ Name</div>
              </div>
              <div className="flex flex-col">
                {recentNotes.map((n) => {
                  const title = getNoteDisplayTitle(n)
                  const date = new Date(n.updatedAt || n.createdAt)
                  const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onSelectNote(n.id)}
                      className="group flex items-center gap-4 border-b border-[var(--border-subtle)] px-2 py-2.5 transition-[background-color] duration-150 ease-out hover:bg-[var(--bg-hover)] md:gap-6 md:py-4"
                    >
                      <div className="flex w-20 shrink-0 items-center gap-3 md:w-24">
                        <div className="h-1.5 w-1.5 bg-[var(--accent)] opacity-80" />
                        <span className="text-[12px] font-medium tracking-tight text-[var(--text-muted)] tabular-nums group-hover:text-[var(--text-primary)] md:text-[13px] active:scale-[0.97] transition-transform">
                          {formattedDate}
                        </span>
                      </div>
                      <span className="truncate text-[18px] font-medium tracking-tight text-[var(--text-secondary)] transition-colors duration-200 group-hover:text-[var(--text-primary)] md:text-[26px]">
                        {title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <FirstNotePrompt />
          )}
        </div>
        {/* Mobile action bar */}
        <div className="mobile-action-bar" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="mobile-action-bar-inner">
            <button type="button" onClick={onToggleSidebar}>
              <Icon icon={SidebarLeftIcon} size={18} strokeWidth={1.5} />
            </button>
            <button type="button" onClick={() => onNewNote?.()}>
              <Icon icon={Add01Icon} size={18} strokeWidth={1.5} />
            </button>
            {onOpenCommandPalette && (
              <button type="button" onClick={onOpenCommandPalette}>
                <Icon icon={CommandIcon} size={18} strokeWidth={1.5} />
              </button>
            )}
            <AccentPicker accentId={accentId} onAccentChange={onAccentChange} theme={theme} mobile />
            <button type="button" onClick={onToggleTheme}>
              {theme === 'dark' ? <Icon icon={Sun01Icon} size={18} strokeWidth={1.5} /> : <Icon icon={Moon01Icon} size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const createdAtLabel = formatCreatedAt(note.createdAt)
  const wordCount = countBodyWords(note.content)
  const readTime = estimateReadTime(note.content)
  // Session baseline: reset whenever the open note changes
  if (note.id !== prevNoteIdRef.current) {
    prevNoteIdRef.current = note.id
    sessionBaseRef.current = wordCount
  }
  const sessionDelta = wordCount - (sessionBaseRef.current ?? wordCount)
  const saveBadgeMeta = getSaveBadgeMeta(saveStatus)
  const saveLabel = saveStatus?.label || 'Local'
  const saveDetail = saveStatus?.detail || 'Saved in this browser'
  const saveError = saveStatus?.error
  const lastSavedLabel = formatRelativeSaveTime(lastSavedAt)

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
          className="absolute top-3 right-3 z-50 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 opacity-20 transition-[opacity,background-color] duration-150 ease-out hover:opacity-80 hover:bg-[var(--bg-hover)] select-none"
          style={{ color: 'var(--text-muted)', fontSize: '11px' }}
          title="Exit focus mode (⌘⇧F)"
        >
          <Icon icon={ArrowExpandIcon} size={12} strokeWidth={1.5} />
          <span>Exit</span>
        </button>
      )}

      {/* Top bar — hidden in focus mode */}
      {!focusMode && (
        <div className="flex items-center justify-between px-4 py-2 md:px-6 relative z-10">
          <div className="flex items-center gap-2">
            {/* Back button — Mobile only */}
            <button
              type="button"
              onClick={() => onSelectNote(null)}
              className="md:hidden relative flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] after:absolute after:-inset-2 active:scale-[0.97]"
              title="Back to Home"
            >
              <Icon icon={ArrowLeft01Icon} size={22} strokeWidth={2} />
            </button>

            {sidebarCollapsed ? (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.97]"
                title="Open sidebar (Cmd+B)"
              >
                <Icon icon={SidebarLeftIcon} size={18} strokeWidth={1.5} style={{ transform: "scaleX(-1)" }} />
              </button>
            ) : (
              <div className="hidden md:block w-10" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {note && (
              <button
                type="button"
                onClick={() => exportNoteAsMarkdown(note)}
                className="hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.97]"
                title="Export as Markdown"
              >
                <Icon icon={Download01Icon} size={18} strokeWidth={1.5} />
              </button>
            )}
            <button
              type="button"
              onClick={onToggleFocusMode}
              className="hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.97]"
              title="Focus mode (⌘⇧F)"
            >
              <Icon icon={ArrowShrinkIcon} size={18} strokeWidth={1.5} />
            </button>
            <AccentPicker accentId={accentId} onAccentChange={onAccentChange} theme={theme} />
            <button
              type="button"
              onClick={onToggleTheme}
              className="hidden md:relative md:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[var(--text-muted)] transition-[transform,background-color,color,border-color] duration-150 ease-out hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-subtle)] after:absolute after:-inset-2 active:scale-[0.97]"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Icon icon={Sun01Icon} size={18} strokeWidth={1.5} /> : <Icon icon={Moon01Icon} size={18} strokeWidth={1.5} />}
            </button>
            {/* Auth: show sign-in or user avatar+signout */}
            {user ? (
              <div className="flex auth-group">
                <div className="auth-pill auth-pill--signed-in" title={`Signed in as ${user.email}`}>
                  <span className="auth-pill__avatar">{user.email?.[0]?.toUpperCase() || '?'}</span>
                  <span className="auth-pill__dot" />
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="auth-signout-btn"
                  title="Sign out"
                >
                  <Icon icon={Logout01Icon} size={16} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="relative flex auth-pill auth-pill--signed-out"
                title="Sign in to sync your notes"
              >
                <Icon icon={CloudUploadIcon} size={14} strokeWidth={2} />
                <span>Sign in</span>
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
              className="note-title-input w-full bg-transparent text-3xl font-bold tracking-tight text-[var(--title-color)] outline-none placeholder:text-[var(--text-muted)] md:text-4xl"
              style={{ fontFamily: 'var(--font-display)' }}
              placeholder="Untitled"
            />
          )}

          {/* Metadata — hidden in focus mode */}
          {!focusMode && (
            <div
              className="mt-3 text-[12px] text-[var(--text-muted)]"
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon icon={Calendar01Icon} size={14} strokeWidth={1.5} className="opacity-70" />
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

          {/* Daily Header */}
          {!focusMode && note.tags?.includes('daily') && (
            <div className="mt-6">
              <DailyHeader note={note} />
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
                onRegisterEditorApi={handleRegisterEditorApi}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Stats bar — bottom right */}
      <div
        className="hidden md:flex absolute bottom-4 right-4 flex-col items-end gap-1.5 px-4 py-2.5 bg-[var(--bg-surface)]/80 backdrop-blur-lg rounded-xl border border-[var(--border-subtle)] transition-all duration-300 z-20"
      >
        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${saveBadgeMeta.toneClassName}`}
            title={saveError || saveDetail}
          >
            <Icon icon={saveBadgeMeta.icon} size={12} strokeWidth={1.8} className={saveBadgeMeta.spin ? 'sync-spin' : undefined} />
            {saveLabel}
          </span>
          {(lastSavedLabel || saveStatus?.state === 'offline') && (
            <span className="text-[var(--text-muted)]" title={saveDetail}>
              Last saved {lastSavedLabel || 'locally'}
            </span>
          )}
          {saveStatus?.canRetry && onRetrySync && (
            <button
              type="button"
              onClick={onRetrySync}
              className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              Retry
            </button>
          )}
        </div>

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

          <span>{new Intl.NumberFormat().format(wordCount)} words</span>

          {/* Reading time */}
          {readTime && (
            <>
              <span className="opacity-40">·</span>
              <span>{readTime}</span>
            </>
          )}
        </div>
      </div>

      {/* Mobile action bar — floating liquid glass */}
      {!focusMode && (
        <div className="mobile-action-bar" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="mobile-action-bar-inner">
            <button type="button" onClick={onToggleSidebar} className="relative transition-transform active:scale-[0.97] after:absolute after:-inset-4">
              <Icon icon={SidebarLeftIcon} size={18} strokeWidth={1.5} />
            </button>
            <button type="button" onClick={() => onNewNote?.()} className="relative transition-transform active:scale-[0.97] after:absolute after:-inset-4">
              <Icon icon={Add01Icon} size={18} strokeWidth={1.5} />
            </button>
            {onOpenCommandPalette && (
              <button type="button" onClick={onOpenCommandPalette} className="relative transition-transform active:scale-[0.97] after:absolute after:-inset-4">
                <Icon icon={CommandIcon} size={18} strokeWidth={1.5} />
              </button>
            )}
            <AccentPicker accentId={accentId} onAccentChange={onAccentChange} theme={theme} mobile />
            <button type="button" onClick={onToggleTheme} className="relative transition-transform active:scale-[0.97] after:absolute after:-inset-4">
              {theme === 'dark' ? <Icon icon={Sun01Icon} size={18} strokeWidth={1.5} /> : <Icon icon={Moon01Icon} size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
