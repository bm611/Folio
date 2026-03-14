import { BubbleMenu } from '@tiptap/react/menus'

const TABLE_ACTIONS = [
  { id: 'delete-row', label: 'Delete Row', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteRow().run() },
  { id: 'delete-col', label: 'Delete Col', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteColumn().run() },
  { id: 'delete-table', label: 'Delete Table', command: (editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteTable().run(), danger: true },
]

export default function TableBubbleMenu({ editor }) {
  if (!editor) {
    return null
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e }) => {
        if (!e.isActive('table')) return false
        const { selection } = e.state
        return selection.empty !== true
      }}
      options={{ placement: 'top', offset: 10 }}
    >
      <div
        className="flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1"
        style={{ boxShadow: 'var(--neu-shadow)' }}
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
