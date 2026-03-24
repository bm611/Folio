import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import TaskItem from '@tiptap/extension-task-item'
import { SquareIcon, CheckmarkSquare01Icon } from '@hugeicons/core-free-icons'
import Icon from '../../components/Icon'

function TaskItemView({ node, updateAttributes }: NodeViewProps) {
  const checked = node.attrs.checked as boolean

  return (
    <NodeViewWrapper
      as="li"
      data-type="taskItem"
      data-checked={checked}
      className={`task-item ${checked ? 'is-checked' : ''}`}
    >
      <label contentEditable={false} className="task-item-checkbox">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => updateAttributes({ checked: e.target.checked })}
          style={{ display: 'none' }}
        />
        <Icon
          icon={checked ? CheckmarkSquare01Icon : SquareIcon}
          size={18}
          stroke={1.5}
          style={{ color: checked ? 'var(--accent)' : 'var(--text-muted)' }}
        />
      </label>

      <NodeViewContent className="task-item-content" />
    </NodeViewWrapper>
  )
}

export const FolioTaskItem = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView)
  },
})
