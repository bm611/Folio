import { BubbleMenu } from '@tiptap/react/menus'

const TABLE_ACTIONS = [
  { id: 'add-row-before', label: 'Row + Above', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).addRowBefore().run() },
  { id: 'add-row-after', label: 'Row + Below', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).addRowAfter().run() },
  { id: 'delete-row', label: 'Delete Row', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteRow().run() },
  { id: 'add-col-before', label: 'Col + Left', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).addColumnBefore().run() },
  { id: 'add-col-after', label: 'Col + Right', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).addColumnAfter().run() },
  { id: 'delete-col', label: 'Delete Col', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteColumn().run() },
  { id: 'delete-table', label: 'Delete Table', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteTable().run() },
]

export default function TableBubbleMenu({ editor }) {
  if (!editor) {
    return null
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: menuEditor }) => menuEditor.isActive('table')}
      options={{ placement: 'top', offset: 10 }}
    >
      <div
        className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1"
        style={{ boxShadow: 'var(--neu-shadow)' }}
      >
        {TABLE_ACTIONS.map((action) => {
          const isDanger = action.id === 'delete-table'
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => action.command(editor)}
              className={`rounded-lg px-2 py-1 text-[11px] transition-colors ${
                isDanger
                  ? 'text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {action.label}
            </button>
          )
        })}
      </div>
    </BubbleMenu>
  )
}
