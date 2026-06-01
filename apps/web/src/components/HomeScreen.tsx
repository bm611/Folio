import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { AnimatePresence } from 'framer-motion'
import {
  Add01Icon,
  Calendar01Icon,
  CloudUploadIcon,
  File01Icon,
  PinIcon,
  Search01Icon,
  SidebarLeftIcon,
} from '@hugeicons/core-free-icons'

import Icon from './Icon'
import SettingsMenu from './SettingsMenu'
import ProfilePanel from './ProfilePanel'
import { useAuth } from '../contexts/AuthContext'
import { countBodyWords, getNoteDisplayTitle } from '../utils/noteMeta'
import { compareRecentNotes, formatRelativeTime } from './noteEditorUtils'
import type { NoteFile, TreeNode } from '../types'
import type { SyncStatus } from './noteEditorUtils'

interface HomeScreenProps {
  notes: TreeNode[]
  onNewNote: () => void
  onCreateDailyNote: () => void
  onUpdateNote: (id: string, updates: Record<string, unknown>, options?: Record<string, unknown>) => void
  onSelectNote: (id: string | null) => void
  theme: string
  onSetTheme: (theme: string) => void
  onCycleTheme: () => void
  accentId: string
  onAccentChange: (id: string) => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  onOpenCommandPalette?: () => void
  onOpenAuthModal: () => void
  syncing: boolean
  syncStatus: SyncStatus
  onSync: () => void
  fontId: string
  onFontChange: (id: string) => void
}

const MINIMAL_SCOPE: CSSProperties = {
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

function getSyncLabel(syncing: boolean, syncStatus: SyncStatus): string {
  if (syncing || syncStatus.state === 'syncing') return 'Saving'
  if (syncStatus.state === 'error') return 'Sync failed'
  if (syncStatus.state === 'offline') return 'Offline'
  if (syncStatus.state === 'saved') return 'Saved'
  return 'Local'
}

function NoteAction({
  children,
  onClick,
  icon,
  primary = false,
}: {
  children: ReactNode
  onClick?: () => void
  icon?: ReactNode
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={primary ? 'quiet-action quiet-action--primary' : 'quiet-action'}
    >
      {icon}
      <span>{children}</span>
    </button>
  )
}

function NoteRow({
  note,
  onSelect,
}: {
  note: NoteFile
  onSelect: (id: string) => void
}) {
  const title = getNoteDisplayTitle(note)
  const wordCount = countBodyWords(note.content)
  const updatedAt = new Date(note.updatedAt || note.createdAt)
  const pinned = note.tags?.includes('pinned') || note.tags?.includes('favorite')
  const preview = (note.content ?? '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_>`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return (
    <li className="quiet-note-row">
      <button type="button" onClick={() => onSelect(note.id)} className="quiet-note-link">
        <span className="quiet-note-icon" aria-hidden>
          {pinned ? (
            <Icon icon={PinIcon} size={13} strokeWidth={1.8} />
          ) : (
            <Icon icon={File01Icon} size={13} strokeWidth={1.7} />
          )}
        </span>
        <span className="quiet-note-copy">
          <span className="quiet-note-title">{title}</span>
          {preview && <span className="quiet-note-preview">{preview}</span>}
        </span>
        <span className="quiet-note-meta">
          <span>{formatRelativeTime(updatedAt)}</span>
          <span>{wordCount.toLocaleString()} w</span>
        </span>
      </button>
    </li>
  )
}

function EmptyState({ onNewNote }: { onNewNote: () => void }) {
  return (
    <div className="quiet-empty">
      <h2>Nothing here yet.</h2>
      <p>Start with a blank page.</p>
      <NoteAction
        primary
        onClick={onNewNote}
        icon={<Icon icon={Add01Icon} size={15} strokeWidth={1.8} />}
      >
        New note
      </NoteAction>
    </div>
  )
}

export default function HomeScreen({
  notes,
  onNewNote,
  onCreateDailyNote,
  onSelectNote,
  theme,
  onSetTheme,
  accentId,
  onAccentChange,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenCommandPalette,
  onOpenAuthModal,
  syncing,
  syncStatus,
  onSync,
  fontId,
  onFontChange,
}: HomeScreenProps) {
  const { user } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileAnchorRef = useRef<HTMLDivElement>(null)

  const fileNotes = useMemo(
    () => notes.filter((note): note is NoteFile => note.type === 'file' && !note.deletedAt),
    [notes],
  )
  const sortedNotes = useMemo(() => [...fileNotes].sort(compareRecentNotes), [fileNotes])
  const syncLabel = getSyncLabel(syncing, syncStatus)

  return (
    <div className="quiet-home flex flex-1 min-w-0 flex-col overflow-hidden" style={MINIMAL_SCOPE}>
      <header className="quiet-topbar">
        {sidebarCollapsed ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="quiet-icon-btn"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <Icon icon={SidebarLeftIcon} size={18} strokeWidth={1.6} />
          </button>
        ) : (
          <div className="quiet-topbar-spacer" />
        )}

        <div className="quiet-topbar-right">
          <span className="quiet-sync" style={{ fontFamily: MONO_FONT }}>{syncLabel}</span>
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
            className="!block"
          />
          {user ? (
            <div ref={profileAnchorRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
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
              </button>
              <AnimatePresence>
                {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} />}
              </AnimatePresence>
            </div>
          ) : (
            <button type="button" onClick={onOpenAuthModal} className="quiet-action">
              <Icon icon={CloudUploadIcon} size={14} strokeWidth={1.7} />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </header>

      <main className="quiet-home-main">
        <section className="quiet-home-intro">
          <p className="quiet-label" style={{ fontFamily: MONO_FONT }}>
            {fileNotes.length.toLocaleString()} notes
          </p>
          <div className="quiet-home-title-row">
            <h1>Notes</h1>
            <div className="quiet-home-actions">
              {onOpenCommandPalette && (
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="quiet-icon-btn"
                  title="Search notes"
                  aria-label="Search notes"
                >
                  <Icon icon={Search01Icon} size={17} strokeWidth={1.7} />
                </button>
              )}
              <NoteAction
                onClick={onCreateDailyNote}
                icon={<Icon icon={Calendar01Icon} size={15} strokeWidth={1.8} />}
              >
                Today
              </NoteAction>
              <NoteAction
                primary
                onClick={onNewNote}
                icon={<Icon icon={Add01Icon} size={15} strokeWidth={1.8} />}
              >
                New
              </NoteAction>
            </div>
          </div>
        </section>

        {sortedNotes.length === 0 ? (
          <EmptyState onNewNote={onNewNote} />
        ) : (
          <ul className="quiet-note-list">
            {sortedNotes.map((note) => (
              <NoteRow key={note.id} note={note} onSelect={onSelectNote} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
