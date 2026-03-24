import { useCallback } from 'react'

import { Add01Icon } from '@hugeicons/core-free-icons'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { NodeViewProps } from '@tiptap/react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'

import Icon from '../../components/Icon'

function getCellFocusPosition(tablePos: number, tableNode: ProseMirrorNode, rowIndex: number, colIndex: number): number | null {
  const targetRow = tableNode.child(rowIndex)
  const targetCell = targetRow?.child(colIndex)

  if (!targetRow || !targetCell) {
    return null
  }

  let rowPos = tablePos + 1

  for (let index = 0; index < rowIndex; index += 1) {
    rowPos += tableNode.child(index).nodeSize
  }

  let cellPos = rowPos + 1

  for (let index = 0; index < colIndex; index += 1) {
    cellPos += targetRow.child(index).nodeSize
  }

  return Math.min(cellPos + 1, cellPos + Math.max(targetCell.nodeSize - 2, 1))
}

export default function TableView({ editor, getPos, node }: NodeViewProps) {
  const appendRow = useCallback(() => {
    if (!editor.isEditable || node.childCount === 0) {
      return
    }

    const tablePos = getPos()
    const lastRowIndex = node.childCount - 1
    const lastRow = node.child(lastRowIndex)
    const lastCellIndex = Math.max(lastRow.childCount - 1, 0)

    if (typeof tablePos === 'number') {
      const focusPos = getCellFocusPosition(tablePos, node, lastRowIndex, lastCellIndex)

      if (focusPos != null) {
        editor.chain().focus(focusPos, { scrollIntoView: false }).addRowAfter().run()
        return
      }
    }

    editor.chain().focus(undefined, { scrollIntoView: false }).addRowAfter().run()
  }, [editor, getPos, node])

  const appendColumn = useCallback(() => {
    if (!editor.isEditable || node.childCount === 0) {
      return
    }

    const firstRow = node.firstChild
    const tablePos = getPos()

    if (!firstRow) {
      return
    }

    const lastCellIndex = Math.max(firstRow.childCount - 1, 0)

    if (typeof tablePos === 'number') {
      const focusPos = getCellFocusPosition(tablePos, node, 0, lastCellIndex)

      if (focusPos != null) {
        editor.chain().focus(focusPos, { scrollIntoView: false }).addColumnAfter().run()
        return
      }
    }

    editor.chain().focus(undefined, { scrollIntoView: false }).addColumnAfter().run()
  }, [editor, getPos, node])

  return (
    <NodeViewWrapper className="table-node-view">
      <div className="table-node-view__frame">
        <div className="table-node-view__scroller">
          <NodeViewContent as={'table' as never} className="table-node-view__table" />
        </div>

        <button
          type="button"
          contentEditable={false}
          className="table-node-view__add table-node-view__add--column"
          onClick={appendColumn}
          disabled={!editor.isEditable}
          aria-label="Add column"
          title="Add column"
        >
          <Icon icon={Add01Icon} size={16} stroke={1.65} />
        </button>

        <button
          type="button"
          contentEditable={false}
          className="table-node-view__add table-node-view__add--row"
          onClick={appendRow}
          disabled={!editor.isEditable}
          aria-label="Add row"
          title="Add row"
        >
          <Icon icon={Add01Icon} size={16} stroke={1.65} />
        </button>
      </div>
    </NodeViewWrapper>
  )
}
