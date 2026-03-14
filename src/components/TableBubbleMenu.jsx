import { BubbleMenu } from '@tiptap/react/menus'
import { useCallback, useEffect, useRef } from 'react'

const TABLE_ACTIONS = [
  { id: 'delete-row', label: 'Delete Row', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteRow().run() },
  { id: 'delete-col', label: 'Delete Col', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteColumn().run() },
  { id: 'delete-table', label: 'Delete Table', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteTable().run(), danger: true },
]

export default function TableBubbleMenu({ editor }) {
  const menuRef = useRef(null)
  const isVisible = useRef(false)

  const shouldShow = useCallback(({ editor: e }) => {
    if (!e.isActive('table')) {
      isVisible.current = false
      return false
    }
    const show = e.state.selection.empty !== true
    isVisible.current = show
    return show
  }, [])

  useEffect(() => {
    if (!editor) return undefined

    const editorEl = editor.view.dom

    const suppressNativeMenu = (e) => {
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

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      options={{ placement: 'top', offset: 10 }}
    >
      <div
        ref={menuRef}
        className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1"
        style={{ boxShadow: 'var(--neu-shadow)', WebkitUserSelect: 'none', userSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {TABLE_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => action.command(editor)}
            className={`rounded-lg px-2 py-1 text-[11px] transition-colors ${
              action.danger
                ? 'text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
            }`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </BubbleMenu>
  )
}
