import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import TaskItem from '@tiptap/extension-task-item'
import { SquareIcon, CheckmarkSquare01Icon } from '@hugeicons/core-free-icons'
import Icon from '../../components/Icon'

function TaskItemView({ node, updateAttributes }) {
  const { checked } = node.attrs

  return (
    <NodeViewWrapper
      as="li"
      data-type="taskItem"
      data-checked={checked}
      className={`task-item ${checked ? 'is-checked' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        margin: '0.2rem 0',
        listStyle: 'none',
      }}
    >
      <label
        contentEditable={false}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '0.5rem',
          cursor: 'pointer',
          userSelect: 'none',
          color: checked ? 'var(--accent)' : 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => updateAttributes({ checked: e.target.checked })}
          style={{ display: 'none' }}
        />
        {checked ? <Icon icon={CheckmarkSquare01Icon} size={18} stroke={1.5} /> : <Icon icon={SquareIcon} size={18} stroke={1.5} />}
      </label>

      <NodeViewContent
        className="task-item-content"
        style={{
          flex: 1,
          minWidth: 0,
          textDecoration: checked ? 'line-through' : 'none',
          color: checked ? 'var(--text-muted)' : 'inherit',
          transition: 'all 0.2s ease',
        }}
      />
    </NodeViewWrapper>
  )
}

export const AuraTaskItem = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TaskItemView)
  },
})
