import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'

import {
  Search01Icon,
  SidebarLeftIcon,
  Folder01Icon,
  File01Icon,
  Delete01Icon,
  Edit01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  FileAddIcon,
  FolderAddIcon,
  MoveToIcon,
  MoreHorizontalIcon,
  Home01Icon,
  Cancel01Icon,
  CloudIcon,
  CloudSavingDone01Icon,
  CloudUploadIcon,
  Loading01Icon,
  StickyNoteIcon,
  SparklesIcon,
  ArrowShrink02Icon,
  Image01Icon,
} from '@hugeicons/core-free-icons'

import type { IconSvgElement } from '@hugeicons/react'
import Icon from './Icon'
import { useAuth } from '../contexts/AuthContext'
import { CATEGORY_ICONS, CATEGORY_ICON_MAP } from '../config/categoryIcons'
import { getVisibleFiles, getParentId } from '../utils/tree'
import type { TreeNode as TreeNodeType } from '../types'
import MoveToModal from './MoveToModal'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncStatus {
  state: string
  message?: string
  error?: string | null
}

interface CreatingState {
  parentId: string | null
  type: 'file' | 'folder'
}

interface SidebarProps {
  tree: TreeNodeType[]
  activeNoteId: string | null
  onSelectNote: (id: string | null) => void
  onNewNote: (overrides?: Record<string, unknown>, options?: Record<string, unknown>) => unknown
  onNewFolder?: (name: string, parentId: string | null) => void
  onDeleteNote: (id: string) => void
  onRenameNode?: (id: string, name: string) => void
  onMoveNode?: (id: string, newParentId: string | null) => void
  onChangeIcon?: (id: string, icon: string | null) => void
  collapsed: boolean
  onToggleCollapse: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  width?: number
  onResizeStart?: (e: React.MouseEvent) => void
  syncing?: boolean
  syncStatus?: SyncStatus
  onOpenTemplateGallery?: () => void
  activeView?: 'notes' | 'chat'
  onViewChange?: (view: 'notes' | 'chat') => void
}

interface SyncIndicatorProps {
  syncing: boolean
  syncStatus?: SyncStatus
}

interface TreeNodeComponentProps {
  node: TreeNodeType
  depth: number
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onMove?: (id: string) => void
  onChangeIcon?: (id: string, icon: string | null) => void
  expanded: Set<string>
  toggleExpand: (id: string, forceOpen?: boolean) => void
  creatingIn: CreatingState | null
  setCreatingIn: (state: CreatingState | null) => void
  onCreateConfirm: (name: string, parentId: string | null, type: 'file' | 'folder') => void
}

interface InlineCreatorProps {
  depth: number
  type: 'file' | 'folder'
  onConfirm: (name: string) => void
  onCancel: () => void
}

// ─── Icon key → Hugeicons data object map ────────────────────────────────────
const ICON_MAP: Record<string, IconSvgElement> = {
  folder: Folder01Icon,
  file: File01Icon,
  trash: Delete01Icon,
  edit: Edit01Icon,
  chevR: ArrowRight01Icon,
  chevD: ArrowDown01Icon,
  newFile: FileAddIcon,
  newFolder: FolderAddIcon,
  move: MoveToIcon,
  more: MoreHorizontalIcon,
  image: Image01Icon,
}

function SidebarIcon({ n, s = 16 }: { n: string; s?: number }) {
  const iconData = ICON_MAP[n]
  if (!iconData) return null
  return <Icon icon={iconData} size={s} strokeWidth={1.5} style={{ display: 'block' }} />
}

// ─── Sync Indicator (inline next to app name) ────────────────────────────────
export function SyncIndicator({ syncing, syncStatus }: SyncIndicatorProps) {
  const { user } = useAuth()
  const state = syncStatus?.state

  let icon: IconSvgElement
  let iconColor: string
  let tooltip: string
  let spin = false

  if (!user) {
    icon = CloudUploadIcon
    iconColor = 'var(--warning)'
    tooltip = 'Sign in to save your notes'
  } else if (state === 'offline') {
    icon = CloudIcon
    iconColor = 'var(--warning)'
    tooltip = syncStatus?.message || 'Offline — changes are safe'
  } else if (state === 'error') {
    icon = CloudIcon
    iconColor = 'var(--danger)'
    tooltip = syncStatus?.error || 'Cloud sync failed'
  } else if (syncing || state === 'syncing') {
    icon = Loading01Icon
    iconColor = 'var(--success)'
    tooltip = 'Saving to cloud…'
    spin = true
  } else {
    icon = CloudSavingDone01Icon
    iconColor = 'var(--success)'
    tooltip = `Synced to cloud as ${user.email}`
  }

  return (
    <span className="sb-sync-indicator" title={tooltip}>
      <Icon icon={icon} size={16} strokeWidth={1.5} style={{ color: iconColor }} className={spin ? 'sync-spin' : ''} />
    </span>
  )
}

// ─── Tree Node ─────────────────────────────────────────────────────────────────
function TreeNodeComponent({
  node,
  depth,
  activeId,
  onSelect,
  onDelete,
  onRename,
  onMove,
  onChangeIcon,
  expanded,
  toggleExpand,
  creatingIn,
  setCreatingIn,
  onCreateConfirm,
}: TreeNodeComponentProps) {
  const [hover, setHover] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState(node.name)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [iconPicker, setIconPicker] = useState(false)
  const [showAllChildren, setShowAllChildren] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nodeRef = useRef<HTMLDivElement>(null)
  const isFolder = node.type === 'folder'
  const isOpen = expanded.has(node.id)
  const isActive = activeId === node.id

  useEffect(() => {
    if (renaming) {
      renameRef.current?.focus()
      renameRef.current?.select()
    }
  }, [renaming])

  const submitRename = () => {
    if (renameVal.trim()) onRename(node.id, renameVal.trim())
    setRenaming(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (renaming) return

    const touch = e.touches[0]
    if (!touch) return
    const rect = nodeRef.current?.getBoundingClientRect()
    longPressRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(12)
      setContextMenu({
        x: Math.min(touch.clientX, window.innerWidth - 180),
        y: rect ? rect.bottom + 4 : touch.clientY,
      })
      longPressRef.current = null
    }, 550)
  }

  const handleTouchEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  const handleTouchMove = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current)
  }

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)

    const timer = setTimeout(() => {
      window.addEventListener('click', close)
    }, 10)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('click', close)
    }
  }, [contextMenu])

  return (
    <div>
      <div
        ref={nodeRef}
        className={`tree-node ${isFolder ? 'is-folder' : 'is-file'}${isActive ? ' active' : ''}`}
        style={{ paddingLeft: depth * 18 + 12 }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setContextMenu({ x: e.clientX, y: e.clientY })
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onClick={(e) => {
          if (!renaming && !contextMenu && !longPressRef.current) {
            if (isFolder) {
              toggleExpand(node.id)
            } else {
              onSelect(node.id)
            }
          } else if (contextMenu) {
            e.stopPropagation()
          }
        }}
      >
        <span className={`tn-arrow relative after:absolute after:-inset-2 ${isOpen ? 'open' : ''}`} style={{ opacity: isFolder ? 1 : 0 }}>
          <SidebarIcon n="chevR" s={14} />
        </span>
        <span className="tn-icon">
          {node.icon && CATEGORY_ICON_MAP[node.icon] ? (
            <Icon icon={CATEGORY_ICON_MAP[node.icon]!} size={16} strokeWidth={1.5} style={{ display: 'block' }} />
          ) : (
            <SidebarIcon n={isFolder ? 'folder' : 'file'} s={16} />
          )}
        </span>
        {renaming ? (
          <input
            ref={renameRef}
            className="ren-input"
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') setRenaming(false)
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="tn-name" title={node.name}>
            {node.name}
          </span>
        )}
        {hover && !renaming && (
          <span className="tn-actions" onClick={(e) => e.stopPropagation()}>
            {isFolder && (
              <button
                title="New File"
                onClick={() => {
                  setCreatingIn({ parentId: node.id, type: 'file' })
                  toggleExpand(node.id, true)
                }}
              >
                <SidebarIcon n="newFile" s={14} />
              </button>
            )}
            <button
              title="More actions"
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                setContextMenu({ x: rect.left, y: rect.bottom + 4 })
              }}
            >
              <SidebarIcon n="more" s={14} />
            </button>
          </span>
        )}
      </div>

      {/* Context menu (⋯ button / long-press) - rendered via portal to escape sidebar overflow */}
      {contextMenu && createPortal(
        <div className="ctx-menu-overlay" onClick={() => setContextMenu(null)}>
          <div
            className="ctx-menu animate-ctx-fade-in"
            style={{
              top: contextMenu.y,
              left: Math.min(contextMenu.x, window.innerWidth - 172),
              transformOrigin: 'top center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isFolder ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCreatingIn({ parentId: node.id, type: 'file' })
                    toggleExpand(node.id, true)
                    setContextMenu(null)
                  }}
                >
                  <SidebarIcon n="newFile" s={16} />
                  <span>New File</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCreatingIn({ parentId: node.id, type: 'folder' })
                    toggleExpand(node.id, true)
                    setContextMenu(null)
                  }}
                >
                  <SidebarIcon n="newFolder" s={16} />
                  <span>New Folder</span>
                </button>
                <div className="ctx-divider" />
              </>
            ) : null}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setRenaming(true)
                setRenameVal(node.name)
                setContextMenu(null)
              }}
            >
              <SidebarIcon n="edit" s={16} />
              <span>Rename</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMove?.(node.id)
                setContextMenu(null)
              }}
            >
              <SidebarIcon n="move" s={16} />
              <span>Move to...</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIconPicker(true)
                setContextMenu(null)
              }}
            >
              <SidebarIcon n="image" s={16} />
              <span>Change Icon</span>
            </button>
            <button
              className="ctx-danger"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(node.id)
                setContextMenu(null)
              }}
            >
              <SidebarIcon n="trash" s={16} />
              <span>Delete</span>
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* Icon picker popover — portaled to body so it can overflow the sidebar */}
      {iconPicker && createPortal(
        <div className="ctx-menu-overlay" onClick={() => setIconPicker(false)}>
          <div
            className="ctx-menu icon-picker-menu animate-ctx-fade-in"
            style={{
              top: nodeRef.current ? nodeRef.current.getBoundingClientRect().bottom + 6 : 0,
              left: nodeRef.current ? nodeRef.current.getBoundingClientRect().left + 8 : 0,
              transformOrigin: 'top left',
              width: 360,
              padding: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[13px] font-medium text-[var(--text-secondary)]">Choose an icon</span>
              {node.icon && (
                <button
                  className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => {
                    onChangeIcon?.(node.id, null)
                    setIconPicker(false)
                  }}
                >
                  Reset
                </button>
              )}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {CATEGORY_ICONS.map((entry) => (
                <button
                  key={entry.key}
                  className={`glass-icon flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-[background-color,color,border-color,box-shadow] hover:bg-[var(--glass-bg-hover)] ${node.icon === entry.key ? 'bg-[var(--glass-bg-hover)] ring-1.5 ring-[var(--accent)]' : ''}`}
                  title={entry.label}
                  onClick={() => {
                    onChangeIcon?.(node.id, entry.key)
                    setIconPicker(false)
                  }}
                >
                  <Icon icon={entry.icon} size={20} strokeWidth={1.5} style={{ display: 'block' }} />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {isFolder && isOpen && (
        <div className="tn-children">
          <div className="tn-children-line" style={{ left: depth * 18 + 20 }} />
          {node.type === 'folder' && (() => {
            const children = node.children ?? []
            const LIMIT = 5
            const visible = showAllChildren ? children : children.slice(0, LIMIT)
            const hidden = children.length - LIMIT
            return (
              <>
                {visible.map((child) => (
                  <TreeNodeComponent
                    key={child.id}
                    node={child}
                    depth={depth + 1}
                    activeId={activeId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onRename={onRename}
                    onMove={onMove}
                    onChangeIcon={onChangeIcon}
                    expanded={expanded}
                    toggleExpand={toggleExpand}
                    creatingIn={creatingIn}
                    setCreatingIn={setCreatingIn}
                    onCreateConfirm={onCreateConfirm}
                  />
                ))}
                {!showAllChildren && hidden > 0 && (
                  <button
                    className="tn-show-more"
                    style={{ paddingLeft: (depth + 1) * 18 + 12 }}
                    onClick={(e) => { e.stopPropagation(); setShowAllChildren(true) }}
                  >
                    {hidden} more...
                  </button>
                )}
              </>
            )
          })()}
          {creatingIn?.parentId === node.id && (
            <InlineCreator
              depth={depth + 1}
              type={creatingIn.type}
              onConfirm={(name) => onCreateConfirm(name, creatingIn.parentId, creatingIn.type)}
              onCancel={() => setCreatingIn(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function InlineCreator({ depth, type, onConfirm, onCancel }: InlineCreatorProps) {
  const [val, setVal] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="inline-creator" style={{ paddingLeft: depth * 18 + 12 }}>
      <span className="tn-icon">
        <SidebarIcon n={type === 'folder' ? 'folder' : 'file'} s={15} />
      </span>
      <input
        ref={ref}
        className="ren-input focus:border-[var(--accent)]"
        value={val}
        placeholder={type === 'folder' ? 'folder name' : 'file name'}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && val.trim()) onConfirm(val.trim())
          if (e.key === 'Escape') onCancel()
        }}
        onBlur={() => (val.trim() ? onConfirm(val.trim()) : onCancel())}
      />
    </div>
  )
}

// ─── Sidebar Component ────────────────────────────────────────────────────────

export default function Sidebar({
  tree,
  activeNoteId,
  onSelectNote,
  onNewNote,
  onNewFolder,
  onDeleteNote,
  onRenameNode,
  onMoveNode,
  onChangeIcon,
  collapsed,
  onToggleCollapse,
  searchQuery,
  onSearchChange,
  width = 280,
  onResizeStart,
  onOpenTemplateGallery,
  activeView = 'notes',
  onViewChange,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['1']))
  const [creatingIn, setCreatingIn] = useState<CreatingState | null>(null)
  const [searchFocused, setSearchFocused] = useState(false)
  const [moveToNode, setMoveToNode] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const toggleExpand = (id: string, forceOpen?: boolean) =>
    setExpanded((prev) => {
      const s = new Set(prev)
      if (forceOpen || !s.has(id)) s.add(id)
      else s.delete(id)
      return s
    })

  const collapseAll = () => setExpanded(new Set())

  const handleCreateConfirm = useCallback((name: string, parentId: string | null, type: 'file' | 'folder') => {
    if (type === 'folder') {
      onNewFolder?.(name, parentId)
    } else {
      const newNote = onNewNote({ title: name }, { parentId, activate: true })
      if (newNote && window.innerWidth < 768) onToggleCollapse()
    }
    setCreatingIn(null)
  }, [onNewFolder, onNewNote, onToggleCollapse])

  const handleRename = useCallback((id: string, name: string) => {
    onRenameNode?.(id, name)
  }, [onRenameNode])

  const handleRootCreate = useCallback((type: 'file' | 'folder') => setCreatingIn({ parentId: null, type }), [])

  const visibleTree = useMemo(() => {
    const sortNodes = (nodes: TreeNodeType[]): TreeNodeType[] => {
      return [...nodes]
        .sort((a, b) => {
          if (a.type === 'folder' && b.type !== 'folder') return -1
          if (a.type !== 'folder' && b.type === 'folder') return 1
          return a.name.localeCompare(b.name)
        })
        .map((node) => {
          if (node.type === 'folder' && node.children) {
            return { ...node, children: sortNodes(node.children) }
          }
          return node
        })
    }

    if (!searchQuery.trim()) return sortNodes(tree)
    const lowerQ = searchQuery.toLowerCase()

    const filterNodes = (nodes: TreeNodeType[]): TreeNodeType[] => {
      const result: TreeNodeType[] = []
      for (const node of nodes) {
        if (node.type === 'file' && node.name.toLowerCase().includes(lowerQ)) {
          result.push({ ...node })
        } else if (node.type === 'folder') {
          const filteredChildren = filterNodes(node.children || [])
          if (filteredChildren.length > 0 || node.name.toLowerCase().includes(lowerQ)) {
            result.push({ ...node, children: filteredChildren })
          }
        }
      }
      return result
    }
    return sortNodes(filterNodes(tree))
  }, [tree, searchQuery])

  
  const searchExpanded = searchFocused || searchQuery.length > 0

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const files = getVisibleFiles(visibleTree, expanded)
        if (files.length === 0) return

        const currentIndex = files.findIndex((f) => f.id === activeNoteId)
        let nextIndex = currentIndex

        if (e.key === 'ArrowUp') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex
          if (currentIndex === -1) nextIndex = files.length > 0 ? files.length - 1 : -1
        } else if (e.key === 'ArrowDown') {
          nextIndex = currentIndex !== -1 && currentIndex < files.length - 1 ? currentIndex + 1 : currentIndex
          if (currentIndex === -1) nextIndex = 0
        }

        if (nextIndex !== -1 && nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < files.length) {
          e.preventDefault()
          onSelectNote(files[nextIndex]!.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeNoteId, visibleTree, expanded, onSelectNote])

  useEffect(() => {
    const activeNode = document.querySelector('.tree-node.active')
    if (activeNode) {
      activeNode.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeNoteId])

  return (
    <>
      {/* Mobile backdrop — always in DOM so it can fade out */}
      <div
        className={`fixed inset-0 z-30 md:hidden transition-[opacity,backdrop-filter] duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: collapsed ? 'blur(0px)' : 'blur(4px)' }}
        onClick={onToggleCollapse}
      />

      {/* On mobile this element is always 0-wide in the flex row; the aside is position:fixed and slides over the content */}
      <aside
        className={`sidebar-vs
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:h-[100dvh] max-md:w-[60vw]
          max-md:transition-transform max-md:duration-300 max-md:ease-out
          ${collapsed ? 'max-md:-translate-x-full' : 'max-md:translate-x-0'}
          md:relative md:z-auto md:h-[100dvh] md:shrink-0 md:transition-[width] md:duration-300 md:ease-out`}
        style={{
          width: typeof window !== 'undefined' && window.innerWidth < 768 ? undefined : (collapsed ? 0 : width),
        }}
      >
        <div className="flex flex-col h-full w-full min-w-[200px]">
          {/* Header — app name + collapse icon */}
          <div className="sb-header-wrapper">
            <span className="flex items-center gap-1.5">
              <span className="sb-app-name">Folio</span>
            </span>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="glass-icon relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out hover:text-[var(--text-primary)] after:absolute after:-inset-3 active:scale-[0.96]"
              title="Toggle sidebar (Cmd+B)"
            >
              <Icon icon={SidebarLeftIcon} size={22} stroke={1.5} />
            </button>
          </div>

          {/* Nav items — Home, Search, Sync */}
          <div className="sb-nav-items">
            {/* Home */}
            <button
              className={`sb-nav-item${activeNoteId === null && activeView === 'notes' ? ' is-active' : ''}`}
              onClick={() => {
                onViewChange?.('notes')
                onSelectNote(null)
                if (window.innerWidth < 768) onToggleCollapse()
              }}
            >
              <span className="sb-nav-icon">
                <Icon icon={Home01Icon} size={19} stroke={1.5} />
              </span>
              <span className="sb-nav-label">Home</span>
            </button>

            {/* Templates */}
            <button
              className="sb-nav-item"
              onClick={onOpenTemplateGallery}
            >
              <span className="sb-nav-icon">
                <Icon icon={StickyNoteIcon} size={19} stroke={1.5} />
              </span>
              <span className="sb-nav-label">Templates</span>
            </button>

            {/* Chat */}
            <button
              className={`sb-nav-item${activeView === 'chat' ? ' is-active' : ''}`}
              onClick={() => {
                onViewChange?.('chat')
                if (window.innerWidth < 768) onToggleCollapse()
              }}
            >
              <span className="sb-nav-icon">
                <Icon icon={SparklesIcon} size={19} stroke={1.5} />
              </span>
              <span className="sb-nav-label">Chat</span>
            </button>

            {/* Search — expands inline on click */}
            <div
              className={`sb-nav-item sb-nav-search${searchExpanded ? ' is-expanded' : ''}`}
              onClick={() => {
                if (!searchExpanded) {
                  setSearchFocused(true)
                  setTimeout(() => searchInputRef.current?.focus(), 10)
                }
              }}
            >
              <span className="sb-nav-icon">
                <Icon icon={Search01Icon} size={19} stroke={1.5} />
              </span>
              {searchExpanded ? (
                <>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Find a note..."
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => {
                      if (!searchQuery) setSearchFocused(false)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="sb-nav-search-clear"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSearchChange('')
                        setSearchFocused(false)
                      }}
                      aria-label="Clear search"
                    >
                      <Icon icon={Cancel01Icon} size={14} stroke={2} />
                    </button>
                  )}
                </>
              ) : (
                <span className="sb-nav-label">Search</span>
              )}
            </div>
          </div>

          {/* Tree list */}
          <div className="sb-tree">
            <div className="sb-tree-actions">
              <span className="text-[15px] font-semibold text-[var(--text-secondary)] select-none" style={{ fontFamily: '"Outfit", var(--body-font)', paddingLeft: 4 }}>Notes</span>
              {!searchQuery.trim() && (
                <div className="flex items-center gap-0">
                  <button
                    className="sb-tree-action-btn has-tooltip"
                    data-tooltip="Collapse All"
                    onClick={collapseAll}
                  >
                    <Icon icon={ArrowShrink02Icon} size={20} strokeWidth={1.5} />
                  </button>
                  <button
                    className="sb-tree-action-btn has-tooltip"
                    data-tooltip="New File"
                    onClick={() => handleRootCreate('file')}
                  >
                    <SidebarIcon n="newFile" s={20} />
                  </button>
                  <button
                    className="sb-tree-action-btn has-tooltip"
                    data-tooltip="New Folder"
                    onClick={() => handleRootCreate('folder')}
                  >
                    <SidebarIcon n="newFolder" s={20} />
                  </button>
                </div>
              )}
            </div>
            {visibleTree.map((node) => (
              <TreeNodeComponent
                key={node.id}
                node={node}
                depth={0}
                activeId={activeNoteId}
                onSelect={(id) => {
                  onSelectNote(id)
                  if (window.innerWidth < 768) onToggleCollapse()
                }}
                onDelete={(id) => onDeleteNote(id)}
                onRename={handleRename}
                onMove={(id) => setMoveToNode(id)}
                onChangeIcon={onChangeIcon}
                expanded={expanded}
                toggleExpand={toggleExpand}
                creatingIn={creatingIn}
                setCreatingIn={setCreatingIn}
                onCreateConfirm={handleCreateConfirm}
              />
            ))}
            {creatingIn?.parentId === null && (
              <InlineCreator
                depth={0}
                type={creatingIn.type}
                onConfirm={(name) => handleCreateConfirm(name, null, creatingIn.type)}
                onCancel={() => setCreatingIn(null)}
              />
            )}
            {searchQuery.trim() && visibleTree.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No notes matched that search.</div>
            )}
          </div>
        </div>

        {/* Mobile close button */}
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="relative absolute bottom-[calc(2.5rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-2xl backdrop-blur-xl transition-[transform,background-color,box-shadow] duration-150 ease-out after:absolute after:-inset-3 md:hidden active:scale-[0.92]"
                         aria-label="Close sidebar"
          >
            <Icon icon={Cancel01Icon} size={24} stroke={2} />
          </button>
        )}

        {onResizeStart && <div className="resize-handle max-md:hidden" onMouseDown={onResizeStart} />}
      </aside>

      <MoveToModal
        open={moveToNode !== null}
        nodeId={moveToNode ?? ''}
        tree={tree}
        currentParentId={moveToNode ? getParentId(tree, moveToNode) : null}
        onConfirm={(newParentId) => {
          if (moveToNode) {
            onMoveNode?.(moveToNode, newParentId)
          }
          setMoveToNode(null)
        }}
        onClose={() => setMoveToNode(null)}
      />
    </>
  )
}
