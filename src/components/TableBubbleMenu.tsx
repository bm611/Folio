import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
    label: 'Delete Col',
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
  const isVisible = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTableActive, setIsTableActive] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 767px), (pointer: coarse)')
    const update = () => setIsMobile(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => {
      mediaQuery.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    if (!editor) {
      return undefined
    }

    const update = () => {
      const active = editor.isEditable && editor.isActive('table')
      isVisible.current = active
      setIsTableActive(active)
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

  const enabledActions = useMemo(
    () => TABLE_ACTIONS.map((action) => ({ ...action, enabled: editor ? (action.isEnabled?.(editor) ?? true) : false })),
    [editor, isTableActive]
  )

  const shouldShow = useCallback(({ editor: e }: { editor: Editor }) => {
    const show = e.isEditable && e.isActive('table')
    isVisible.current = show
    setIsTableActive(show)
    return show
  }, [])

  useEffect(() => {
    if (!editor || !editor.isEditable) return undefined

    let editorEl: HTMLElement
    try {
      editorEl = editor.view.dom
    } catch {
      return undefined
    }

    const suppressNativeMenu = (e: Event) => {
      if (isVisible.current) {
        e.preventDefault()
      }
    }

    editorEl.addEventListener('contextmenu', suppressNativeMenu)

    return () => {
      editorEl.removeEventListener('contextmenu', suppressNativeMenu)
    }
  }, [editor])

  if (!editor) {
    return null
  }

  if (isMobile) {
    if (!isTableActive) {
      return null
    }

    return (
      <div
        className="mobile-action-bar mobile-action-bar--editor"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mobile-editor-toolbar-inner">
          {enabledActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                action.command(editor)
              }}
              disabled={!action.enabled}
              className={`mobile-editor-toolbar-btn min-w-[5.5rem] rounded-full px-3 text-[11px] font-medium ${
                action.danger ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'
              } disabled:opacity-45`}
              title={action.label}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      options={{ placement: 'top', offset: 10 }}
    >
      <div
        className="flex items-center gap-1 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1.5"
        style={{ boxShadow: 'var(--neu-shadow)', WebkitUserSelect: 'none', userSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {enabledActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => action.command(editor)}
            disabled={!action.enabled}
            className={`rounded-xl px-2.5 py-1.5 text-[11px] transition-colors ${
              action.danger
                ? 'text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] disabled:hover:bg-transparent'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            } disabled:cursor-not-allowed disabled:opacity-45`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </BubbleMenu>
  )
}
