import { useState, useEffect, useCallback } from 'react'

import type { Editor } from '@tiptap/react'
import {
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextStrikethroughIcon,
  CodeIcon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  CheckListIcon,
  LeftToRightBlockQuoteIcon,
  ListIndentIncreaseIcon,
  ListIndentDecreaseIcon,
  Delete01Icon,
} from '@hugeicons/core-free-icons'

import Icon from './Icon'

interface ToolbarAction {
  id: string
  icon: typeof Heading01Icon
  title: string
  action: (editor: Editor) => void
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    id: 'h1',
    icon: Heading01Icon,
    title: 'Heading 1',
    action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    icon: Heading02Icon,
    title: 'Heading 2',
    action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    icon: Heading03Icon,
    title: 'Heading 3',
    action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bold',
    icon: TextBoldIcon,
    title: 'Bold',
    action: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    id: 'italic',
    icon: TextItalicIcon,
    title: 'Italic',
    action: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    id: 'strike',
    icon: TextStrikethroughIcon,
    title: 'Strikethrough',
    action: (e) => e.chain().focus().toggleStrike().run(),
  },
  {
    id: 'code',
    icon: CodeIcon,
    title: 'Inline Code',
    action: (e) => e.chain().focus().toggleCode().run(),
  },
  {
    id: 'bullet',
    icon: LeftToRightListBulletIcon,
    title: 'Bullet List',
    action: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'ordered',
    icon: LeftToRightListNumberIcon,
    title: 'Numbered List',
    action: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'todo',
    icon: CheckListIcon,
    title: 'Checklist',
    action: (e) =>
      e
        .chain()
        .focus()
        .insertContent({
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph' }],
            },
          ],
        })
        .run(),
  },
  {
    id: 'quote',
    icon: LeftToRightBlockQuoteIcon,
    title: 'Blockquote',
    action: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'indent',
    icon: ListIndentIncreaseIcon,
    title: 'Indent',
    action: (e) => {
      // Try taskItem first (checklists), then listItem (bullet/ordered lists)
      if (!e.chain().focus().sinkListItem('taskItem').run()) {
        e.chain().focus().sinkListItem('listItem').run()
      }
    },
  },
  {
    id: 'dedent',
    icon: ListIndentDecreaseIcon,
    title: 'Dedent',
    action: (e) => {
      if (!e.chain().focus().liftListItem('taskItem').run()) {
        e.chain().focus().liftListItem('listItem').run()
      }
    },
  },
]

interface MobileEditorToolbarProps {
  editor: Editor | null
}

/**
 * Use the Visual Viewport API to position the toolbar just above the
 * on-screen keyboard. `window.visualViewport` gives us the portion of
 * the layout viewport that is actually visible — when the keyboard opens
 * the visual viewport shrinks upward, so we anchor to its bottom edge.
 */
function useKeyboardAwareBottom(): number {
  const [bottom, setBottom] = useState(16)

  const update = useCallback(() => {
    const vv = window.visualViewport
    if (!vv) return

    // Distance from the bottom of the layout viewport to the bottom of
    // the visible area. When the keyboard is closed this is ~0; when it
    // is open it equals the keyboard height.
    const keyboardOffset = window.innerHeight - (vv.offsetTop + vv.height)
    // 8px breathing room above the keyboard, or the default 16px gap
    // from the screen bottom when no keyboard is shown.
    setBottom(keyboardOffset > 0 ? keyboardOffset + 8 : 16)
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return undefined

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [update])

  return bottom
}

const TABLE_ACTIONS = [
  {
    id: 'delete-row',
    label: 'Delete Row',
    command: (editor: Editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteRow().run(),
    canRun: (editor: Editor) => editor.can().deleteRow(),
  },
  {
    id: 'delete-col',
    label: 'Delete Col',
    command: (editor: Editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteColumn().run(),
    canRun: (editor: Editor) => editor.can().deleteColumn(),
  },
  {
    id: 'delete-table',
    label: 'Delete Table',
    command: (editor: Editor) => editor.chain().focus(undefined, { scrollIntoView: false }).deleteTable().run(),
    canRun: (editor: Editor) => editor.can().deleteTable(),
    danger: true,
  },
]

export default function MobileEditorToolbar({ editor }: MobileEditorToolbarProps) {
  const bottom = useKeyboardAwareBottom()
  const [isTableActive, setIsTableActive] = useState(false)

  useEffect(() => {
    if (!editor) return undefined

    const update = () => {
      setIsTableActive(editor.isEditable && editor.isActive('table'))
    }

    update()
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)

    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div
      className="mobile-action-bar mobile-action-bar--editor"
      style={{
        bottom,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="mobile-bar-inner">
      <div className="mobile-action-bar-inner mobile-editor-toolbar-inner">
        {TOOLBAR_ACTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              item.action(editor)
            }}
            className="mobile-editor-toolbar-btn"
            title={item.title}
          >
            <Icon icon={item.icon} size={18} strokeWidth={1.5} />
          </button>
        ))}

        {isTableActive && (
          <>
            <div className="mx-1 h-5 w-px shrink-0 bg-[var(--border-subtle)]" />
            {TABLE_ACTIONS.map((action) => {
              const enabled = action.canRun(editor)
              return (
                <button
                  key={action.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (enabled) action.command(editor)
                  }}
                  disabled={!enabled}
                  className={`mobile-editor-toolbar-btn !w-auto min-w-[4.5rem] rounded-full px-2.5 text-[10px] font-medium ${
                    action.danger ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'
                  } disabled:opacity-40`}
                  title={action.label}
                >
                  <Icon icon={Delete01Icon} size={13} strokeWidth={1.5} className="mr-1 shrink-0" />
                  {action.label}
                </button>
              )
            })}
          </>
        )}
      </div>
      </div>
    </div>
  )
}
