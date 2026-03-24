import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Delete01Icon } from '@hugeicons/core-free-icons'

import Icon from './Icon'

interface TableAction {
  id: string
  label: string
  command: (editor: Editor) => boolean
  isEnabled?: (editor: Editor) => boolean
  danger?: boolean
}

interface TableBubbleMenuProps {
  editor: Editor | null
}

const TABLE_ACTIONS: TableAction[] = [
  {
    id: 'delete-row',
    label: 'Delete Row',
    command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteRow().run(),
    isEnabled: (editor) => editor.can().deleteRow(),
  },
  {
    id: 'delete-column',
    label: 'Delete Column',
    command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteColumn().run(),
    isEnabled: (editor) => editor.can().deleteColumn(),
  },
  {
    id: 'delete-table',
    label: 'Delete Table',
    command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteTable().run(),
    isEnabled: (editor) => editor.can().deleteTable(),
    danger: true,
  },
]

export default function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTableActive, setIsTableActive] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia('(max-width: 767px), (pointer: coarse)')
    const update = () => setIsMobile(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => {
      mediaQuery.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    if (!editor) return undefined

    const update = () => {
      setIsTableActive(editor.isEditable && editor.isActive('table'))
    }

    update()
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    editor.on('focus', update)
    editor.on('blur', update)

    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
      editor.off('focus', update)
      editor.off('blur', update)
    }
  }, [editor])

  // Close context menu when table becomes inactive
  useEffect(() => {
    if (!isTableActive) setContextMenu(null)
  }, [isTableActive])

  const enabledActions = useMemo(
    () => TABLE_ACTIONS.map((action) => ({ ...action, enabled: editor ? (action.isEnabled?.(editor) ?? true) : false })),
    [editor, isTableActive]
  )

  // Right-click handler for table cells (desktop only)
  useEffect(() => {
    if (!editor || !editor.isEditable || isMobile) return undefined

    let editorEl: HTMLElement
    try {
      editorEl = editor.view.dom
    } catch {
      return undefined
    }

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const tableEl = target.closest('.table-node-view')

      if (!tableEl) return

      e.preventDefault()
      setContextMenu({ x: e.clientX, y: e.clientY })
    }

    editorEl.addEventListener('contextmenu', handleContextMenu)

    return () => {
      editorEl.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [editor, isMobile])

  // Close context menu on outside click or escape
  useEffect(() => {
    if (!contextMenu) return undefined

    const close = () => setContextMenu(null)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [contextMenu])

  // Clamp menu position to viewport
  useEffect(() => {
    if (!contextMenu || !menuRef.current) return

    const menu = menuRef.current
    const rect = menu.getBoundingClientRect()
    let { x, y } = contextMenu
    let clamped = false

    if (rect.right > window.innerWidth - 8) {
      x = window.innerWidth - rect.width - 8
      clamped = true
    }
    if (rect.bottom > window.innerHeight - 8) {
      y = window.innerHeight - rect.height - 8
      clamped = true
    }

    if (clamped) setContextMenu({ x, y })
  }, [contextMenu])

  const handleAction = useCallback(
    (action: TableAction & { enabled: boolean }) => {
      if (!editor || !action.enabled) return
      action.command(editor)
      setContextMenu(null)
    },
    [editor]
  )

  if (!editor) return null

  return (
    <>
      {/* Desktop: right-click context menu */}
      {contextMenu && !isMobile && (
        <>
          <div
            className="ctx-menu-overlay"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu(null)
            }}
          />
          <div
            ref={menuRef}
            className="ctx-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {enabledActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={action.danger ? 'ctx-danger' : ''}
                onClick={() => handleAction(action)}
                disabled={!action.enabled}
              >
                <Icon icon={Delete01Icon} size={14} stroke={1.7} />
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Mobile table actions are handled by MobileEditorToolbar */}
    </>
  )
}
