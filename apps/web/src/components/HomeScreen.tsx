import { useMemo, useRef, useState, type ReactNode } from 'react'

import { AnimatePresence } from 'framer-motion'
import {
  Add01Icon,
  Calendar01Icon,
  CloudUploadIcon,
  File01Icon,
  Folder01Icon,
  PinIcon,
  Search01Icon,
  SidebarLeftIcon,
} from '@hugeicons/core-free-icons'

import Icon from './Icon'
import { FOLIO_SCOPE } from './folioScope'
import SettingsMenu from './SettingsMenu'
import ProfilePanel from './ProfilePanel'
import { useAuth } from '../contexts/AuthContext'
import { getNoteDisplayTitle } from '../utils/noteMeta'
import { compareRecentNotes, formatRelativeTime } from './noteEditorUtils'
import type { NoteFile, TreeNode } from '../types'
import type { SyncStatus } from './noteEditorUtils'

interface HomeScreenProps {
  notes: TreeNode[]
  tree?: TreeNode[]
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

const HOME_RECENT_LIMIT = 5

function isPinned(note: NoteFile): boolean {
  return Boolean(note.tags?.includes('pinned') || note.tags?.includes('favorite'))
}

// Map each file id to its folder path (ancestor folder names joined by " / ").
// Files at the root are omitted.
function buildFolderPaths(
  nodes: TreeNode[],
  ancestors: string[] = [],
  map: Map<string, string> = new Map(),
): Map<string, string> {
  for (const node of nodes) {
    if (node.type === 'folder') {
      buildFolderPaths(node.children, [...ancestors, node.name], map)
    } else if (ancestors.length > 0) {
      map.set(node.id, ancestors.join(' / '))
    }
  }
  return map
}

function NoteRow({
  note,
  folderPath,
  onSelect,
}: {
  note: NoteFile
  folderPath?: string
  onSelect: (id: string) => void
}) {
  const title = getNoteDisplayTitle(note)
  const updatedAt = new Date(note.updatedAt || note.createdAt)
  const pinned = isPinned(note)

  return (
    <li className="quiet-note-row">
      <button type="button" onClick={() => onSelect(note.id)} className="quiet-note-link">
        <span className={pinned ? 'quiet-note-icon is-pinned' : 'quiet-note-icon'} aria-hidden>
          {pinned ? (
            <Icon icon={PinIcon} size={14} strokeWidth={1.8} />
          ) : (
            <Icon icon={File01Icon} size={14} strokeWidth={1.7} />
          )}
        </span>
        <span className="quiet-note-copy">
          <span className="quiet-note-title">{title}</span>
          {folderPath && (
            <span className="quiet-note-folder">
              <Icon icon={Folder01Icon} size={11} strokeWidth={1.7} />
              <span>{folderPath}</span>
            </span>
          )}
        </span>
        <span className="quiet-note-meta">
          <span>{formatRelativeTime(updatedAt)}</span>
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
  tree,
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
  const pinnedNotes = useMemo(
    () => fileNotes.filter(isPinned).sort(compareRecentNotes),
    [fileNotes],
  )
  const recentNotes = useMemo(
    () => fileNotes.filter((note) => !isPinned(note)).sort(compareRecentNotes).slice(0, HOME_RECENT_LIMIT),
    [fileNotes],
  )
  const folderPaths = useMemo(() => buildFolderPaths(tree ?? []), [tree])
  const syncLabel = getSyncLabel(syncing, syncStatus)

  return (
    <div className="quiet-home flex flex-1 min-w-0 flex-col overflow-hidden" style={FOLIO_SCOPE}>
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

        {fileNotes.length === 0 ? (
          <EmptyState onNewNote={onNewNote} />
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <section className="quiet-note-section">
                <h2 className="quiet-section-head" style={{ fontFamily: MONO_FONT }}>
                  Pinned
                </h2>
                <ul className="quiet-note-list">
                  {pinnedNotes.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      folderPath={folderPaths.get(note.id)}
                      onSelect={onSelectNote}
                    />
                  ))}
                </ul>
              </section>
            )}

            {recentNotes.length > 0 && (
              <section className="quiet-note-section">
                <h2 className="quiet-section-head" style={{ fontFamily: MONO_FONT }}>
                  Recent
                </h2>
                <ul className="quiet-note-list">
                  {recentNotes.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      folderPath={folderPaths.get(note.id)}
                      onSelect={onSelectNote}
                    />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
