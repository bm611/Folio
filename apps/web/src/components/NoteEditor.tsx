import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'

import { AnimatePresence, motion } from 'framer-motion'
import type { Editor } from '@tiptap/react'
import {
  ArrowLeft01Icon,
  CloudUploadIcon,
  Copy01Icon,
  Home01Icon,
  Share01Icon,
  SidebarLeftIcon,
} from '@hugeicons/core-free-icons'

import Icon from './Icon'
import SettingsMenu from './SettingsMenu'
import ProfilePanel from './ProfilePanel'
import TagInput from './TagInput'
import MobileEditorToolbar from './MobileEditorToolbar'
import NoteBanner from './NoteBanner'
import HomeScreen from './HomeScreen'
import { useAuth } from '../contexts/AuthContext'
import { countBodyWords } from '../utils/noteMeta'
import { exportNoteAsMarkdown } from '../utils/exportNote'
import { createSharedNote, generateSharedNoteUrl } from '../lib/sharedNotes'
import type { EditorApi } from './LiveMarkdownEditor'
import type { NoteFile, TreeNode } from '../types'
import type { SaveStatus, SyncStatus } from './noteEditorUtils'
import { formatRelativeSaveTime, getSaveBadgeMeta, getSaveTextClass } from './noteEditorUtils'

const LiveMarkdownEditor = lazy(() =>
  import('./LiveMarkdownEditor').catch(() => {
    window.location.reload()
    return import('./LiveMarkdownEditor')
  }),
)

const EDITOR_SCOPE: CSSProperties = {
  ['--bg-primary' as string]: '#fbfaf7',
  ['--bg-surface' as string]: '#f3f0eb',
  ['--bg-elevated' as string]: '#fffefa',
  ['--bg-hover' as string]: '#efebe4',
  ['--bg-deep' as string]: '#e8e2d8',
  ['--ink' as string]: '#26231f',
  ['--ink-soft' as string]: '#514d46',
  ['--text-primary' as string]: '#26231f',
  ['--text-secondary' as string]: '#514d46',
  ['--text-muted' as string]: '#8a8377',
  ['--text-inverse' as string]: '#fbfaf7',
  ['--border-subtle' as string]: '#e8e2d8',
  ['--border-default' as string]: '#d8d0c3',
  ['--accent' as string]: '#5f574d',
  ['--accent-hover' as string]: '#3d3933',
  ['--accent-text' as string]: '#fbfaf7',
  ['--accent-soft' as string]: '#ece7df',
  ['--success' as string]: '#5f7157',
  ['--warning' as string]: '#9b7b45',
  ['--danger' as string]: '#9c5a50',
  background: '#fbfaf7',
  color: '#26231f',
  fontFamily: '"Jost", "Avenir Next", "Helvetica Neue", sans-serif',
}

const MONO_FONT = '"Liga SFMono Nerd Font", "IBM Plex Mono", ui-monospace, monospace'

interface NoteEditorProps {
  note: NoteFile | null
  notes: TreeNode[]
  tree?: TreeNode[]
  onNewNote: () => void
  onCreateDailyNote: () => void
  onUpdateNote: (
    id: string,
    updates: Record<string, unknown>,
    options?: Record<string, unknown>,
  ) => void
  onSelectNote: (id: string | null) => void
  onRegisterEditorApi?: (api: EditorApi | null) => void
  theme: string
  onSetTheme: (theme: string) => void
  onCycleTheme: () => void
  accentId: string
  onAccentChange: (id: string) => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onOpenCommandPalette?: () => void
  onOpenAuthModal: () => void
  saveStatus: SaveStatus
  lastSavedAt: string | null
  onRetrySync?: () => void
  syncing: boolean
  syncStatus: SyncStatus
  onSync: () => void
  fontId: string
  onFontChange: (id: string) => void
  wideMode: boolean
  onWideModeChange: (wide: boolean) => void
}

function EditorFallback() {
  return (
    <div className="quiet-editor-loading">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
    </div>
  )
}

function SaveBadge({
  saveStatus,
  lastSavedAt,
}: {
  saveStatus: SaveStatus
  lastSavedAt: string | null
}) {
  const saveBadgeMeta = getSaveBadgeMeta(saveStatus)
  const title = saveStatus.error || (lastSavedAt ? `Last saved ${formatRelativeSaveTime(lastSavedAt)}` : saveStatus.detail)

  return (
    <span
      className={`quiet-save-badge ${getSaveTextClass(saveStatus.state)}`}
      title={title}
      style={{ fontFamily: MONO_FONT }}
    >
      <Icon
        icon={saveBadgeMeta.icon}
        size={11}
        strokeWidth={1.8}
        className={saveBadgeMeta.spin ? 'sync-spin' : undefined}
      />
      {saveStatus.label || 'Saved'}
    </span>
  )
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
  onSetTheme,
  onCycleTheme,
  accentId,
  onAccentChange,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenCommandPalette,
  onOpenAuthModal,
  saveStatus,
  lastSavedAt,
  onRetrySync,
  syncing,
  syncStatus,
  onSync,
  fontId,
  onFontChange,
  wideMode,
  onWideModeChange,
}: NoteEditorProps) {
  const { user } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileAnchorRef = useRef<HTMLDivElement>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied' | 'error'>('idle')
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const editorApiRef = useRef<EditorApi | null>(null)

  const fileNotes = useMemo(() => notes.filter((n): n is NoteFile => n.type === 'file'), [notes])

  useEffect(() => {
    const visualViewport = window.visualViewport
    if (!visualViewport) return undefined

    const checkKeyboard = () => {
      setKeyboardOpen(window.innerHeight - (visualViewport.offsetTop + visualViewport.height) > 80)
    }

    visualViewport.addEventListener('resize', checkKeyboard)
    visualViewport.addEventListener('scroll', checkKeyboard)
    return () => {
      visualViewport.removeEventListener('resize', checkKeyboard)
      visualViewport.removeEventListener('scroll', checkKeyboard)
    }
  }, [])

  const handleRegisterEditorApi = useCallback(
    (api: EditorApi | null) => {
      editorApiRef.current = api
      setEditorInstance(api?.getEditor() ?? null)
      onRegisterEditorApi?.(api)
    },
    [onRegisterEditorApi],
  )

  const handleTitleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      editorApiRef.current?.focus()
    }
  }

  const handleShareNote = useCallback(async () => {
    if (!note) return

    if (!user) {
      onOpenAuthModal()
      return
    }

    clearTimeout(shareTimerRef.current ?? undefined)
    setShareStatus('sharing')

    try {
      const token = await createSharedNote(note, user.id)
      const url = generateSharedNoteUrl(token)
      await navigator.clipboard.writeText(url)
      setShareStatus('copied')
      shareTimerRef.current = setTimeout(() => {
        setShareStatus('idle')
        shareTimerRef.current = null
      }, 2000)
    } catch (error) {
      console.error(error)
      setShareStatus('error')
      shareTimerRef.current = setTimeout(() => {
        setShareStatus('idle')
        shareTimerRef.current = null
      }, 3000)
    }
  }, [note, onOpenAuthModal, user])

  useEffect(() => {
    return () => {
      clearTimeout(shareTimerRef.current ?? undefined)
    }
  }, [])

  if (!note) {
    return (
      <HomeScreen
        notes={notes}
        onNewNote={onNewNote}
        onCreateDailyNote={onCreateDailyNote}
        onUpdateNote={onUpdateNote}
        onSelectNote={onSelectNote}
        theme={theme}
        onSetTheme={onSetTheme}
        onCycleTheme={onCycleTheme}
        accentId={accentId}
        onAccentChange={onAccentChange}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenAuthModal={onOpenAuthModal}
        syncing={syncing}
        syncStatus={syncStatus}
        onSync={onSync}
        fontId={fontId}
        onFontChange={onFontChange}
      />
    )
  }

  const wordCount = countBodyWords(note.content)
  const shareLabel = shareStatus === 'sharing'
    ? 'Sharing'
    : shareStatus === 'copied'
      ? 'Copied'
      : shareStatus === 'error'
        ? 'Retry'
        : 'Share'
  const shareTitle = !user
    ? 'Sign in to share this note'
    : shareStatus === 'sharing'
      ? 'Creating a share link'
      : 'Copy shareable link'

  return (
    <motion.div
      key="editor"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="quiet-editor relative flex flex-1 min-h-0 min-w-0 w-full flex-col overflow-hidden"
      style={EDITOR_SCOPE}
    >
      <header className="quiet-editor-topbar">
        <div className="quiet-editor-nav">
          <motion.button
            type="button"
            onClick={() => onSelectNote(null)}
            whileTap={{ scale: 0.96 }}
            className="quiet-icon-btn md:hidden"
            title="Back to notes"
            aria-label="Back to notes"
          >
            <Icon icon={ArrowLeft01Icon} size={19} strokeWidth={1.8} />
          </motion.button>

          {sidebarCollapsed ? (
            <motion.button
              type="button"
              onClick={onToggleSidebar}
              whileTap={{ scale: 0.96 }}
              className="quiet-icon-btn hidden md:inline-flex"
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <Icon icon={SidebarLeftIcon} size={18} strokeWidth={1.7} style={{ transform: 'scaleX(-1)' }} />
            </motion.button>
          ) : (
            <div className="quiet-topbar-spacer hidden md:block" />
          )}

          <motion.button
            type="button"
            onClick={() => onSelectNote(null)}
            whileTap={{ scale: 0.96 }}
            className="quiet-icon-btn hidden md:inline-flex"
            title="Notes"
            aria-label="Notes"
          >
            <Icon icon={Home01Icon} size={17} strokeWidth={1.7} />
          </motion.button>
        </div>

        <div className="quiet-editor-actions">
          <SaveBadge saveStatus={saveStatus} lastSavedAt={lastSavedAt} />

          {saveStatus.canRetry && onRetrySync && (
            <button type="button" onClick={onRetrySync} className="quiet-text-btn">
              Retry
            </button>
          )}

          <motion.button
            type="button"
            onClick={handleShareNote}
            disabled={shareStatus === 'sharing'}
            whileTap={{ scale: 0.96 }}
            className="quiet-action"
            title={shareTitle}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={shareStatus}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.12 }}
                className="inline-flex items-center gap-1.5"
              >
                <Icon icon={shareStatus === 'copied' ? Copy01Icon : Share01Icon} size={14} strokeWidth={1.7} />
                <span className="hidden sm:inline">{shareLabel}</span>
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <SettingsMenu
            theme={theme}
            onSetTheme={onSetTheme}
            accentId={accentId}
            onAccentChange={onAccentChange}
            syncing={syncing}
            syncStatus={syncStatus}
            onSync={onSync}
            fontId={fontId}
            onFontChange={onFontChange}
            wideMode={wideMode}
            onWideModeChange={onWideModeChange}
            onExport={() => exportNoteAsMarkdown(note)}
          />

          {user ? (
            <div ref={profileAnchorRef} className="relative">
              <motion.button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                whileTap={{ scale: 0.96 }}
                className="quiet-profile"
                title="Profile"
                aria-expanded={profileOpen}
              >
                <span className="quiet-avatar">
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    user.email?.[0]?.toUpperCase() || '?'
                  )}
                </span>
                <span className="quiet-profile-name">
                  {user.user_metadata?.display_name || user.email?.split('@')[0]}
                </span>
              </motion.button>
              <AnimatePresence>
                {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} />}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={onOpenAuthModal}
              whileTap={{ scale: 0.96 }}
              className="quiet-action"
              title="Sign in to sync your notes"
            >
              <Icon icon={CloudUploadIcon} size={14} strokeWidth={1.7} />
              <span>Sign in</span>
            </motion.button>
          )}
        </div>
      </header>

      <MobileEditorToolbar editor={editorInstance} />

      <main className="quiet-editor-scroll">
        <article className={wideMode ? 'quiet-editor-page quiet-editor-page--wide' : 'quiet-editor-page'}>
          <NoteBanner
            noteId={note.id}
            title={note.title}
            icon={note.icon}
            onTitleChange={(title) => onUpdateNote(note.id, { title })}
            onTitleKeyDown={handleTitleKeyDown}
          />

          <details className="quiet-note-details">
            <summary>Details</summary>
            <div className="quiet-note-details-body">
              <TagInput
                tags={note.tags || []}
                onChange={(tags) => onUpdateNote(note.id, { tags }, { skipTimestamp: true })}
              />
              <button
                type="button"
                onClick={handleShareNote}
                disabled={shareStatus === 'sharing'}
                className="quiet-text-btn"
              >
                {shareLabel}
              </button>
            </div>
          </details>

          <Suspense fallback={<EditorFallback />}>
            <LiveMarkdownEditor
              key={note.id}
              value={note.content}
              contentDoc={note.contentDoc}
              notes={fileNotes}
              currentNoteId={note.id}
              currentNoteTitle={note.title}
              wideMode={wideMode}
              onChange={(updates) => onUpdateNote(note.id, { ...updates })}
              onRegisterEditorApi={handleRegisterEditorApi}
            />
          </Suspense>
        </article>
      </main>

      <motion.div
        className="quiet-mobile-status md:hidden"
        animate={{ opacity: keyboardOpen ? 0 : 1 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
        style={{
          pointerEvents: keyboardOpen ? 'none' : 'auto',
          fontFamily: MONO_FONT,
        }}
      >
        <SaveBadge saveStatus={saveStatus} lastSavedAt={lastSavedAt} />
        <span>{wordCount.toLocaleString()} w</span>
      </motion.div>
    </motion.div>
  )
}
