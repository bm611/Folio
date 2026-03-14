import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { useCallback, useRef } from 'react'
import { IconPlus } from '@tabler/icons-react'

function TableView({ editor, node, getPos }) {
  const gridRef = useRef(null)

  const focusLastCell = useCallback((row, col) => {
    const tablePos = getPos()
    if (tablePos == null) return false
    const resolved = editor.state.doc.resolve(tablePos + 1)
    const tableNode = resolved.parent.type.name === 'table' ? resolved.parent : node
    const targetRow = tableNode.child(row)
    if (!targetRow) return false
    let offset = tablePos + 1
    for (let r = 0; r < row; r++) offset += tableNode.child(r).nodeSize
    offset += 1
    for (let c = 0; c < col; c++) offset += targetRow.child(c).nodeSize
    offset += 1
    editor.chain().setTextSelection(offset).run()
    return true
  }, [editor, getPos, node])

  const addRowAfter = useCallback(() => {
    const rowCount = node.childCount
    if (!rowCount) return
    const lastRow = node.child(rowCount - 1)
    focusLastCell(rowCount - 1, lastRow.childCount - 1)
    editor.chain().addRowAfter().run()
  }, [editor, node, focusLastCell])

  const addColumnAfter = useCallback(() => {
    const firstRow = node.firstChild
    if (!firstRow) return
    focusLastCell(0, firstRow.childCount - 1)
    editor.chain().addColumnAfter().run()
  }, [editor, node, focusLastCell])

  return (
    <NodeViewWrapper className="table-wrapper">
      <div
        className="table-container"
        style={{
          display: 'inline-grid',
          gridTemplateColumns: 'max-content min-content',
          gridTemplateRows: 'auto auto',
          columnGap: '4px',
          rowGap: '4px',
        }}
      >
        {/* (row 1, col 1) — the table */}
        <div
          ref={gridRef}
          style={{ gridColumn: 1, gridRow: 1, overflowX: 'auto', position: 'relative' }}
        >
          <NodeViewContent
            as="table"
            style={{ borderCollapse: 'collapse', tableLayout: 'auto' }}
          />
        </div>

        {/* (rows 1-2, col 2) — add column, spans full height */}
        <button
          type="button"
          contentEditable={false}
          onClick={addColumnAfter}
          className="table-add-button table-add-column"
          style={{
            gridColumn: 2,
            gridRow: '1 / 3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 6px',
            border: '1px dashed var(--border-subtle)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            opacity: 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          <IconPlus size={16} stroke={1.5} />
        </button>

        {/* (row 2, col 1) — add row, exactly as wide as the table */}
        <button
          type="button"
          contentEditable={false}
          onClick={addRowAfter}
          className="table-add-button table-add-row"
          style={{
            gridColumn: 1,
            gridRow: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            border: '1px dashed var(--border-subtle)',
            borderRadius: '6px',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            opacity: 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          <IconPlus size={16} stroke={1.5} />
        </button>
      </div>

      <style>{`
        .table-wrapper {
          position: relative;
          overflow-x: auto;
        }
        .table-wrapper:hover .table-add-button {
          opacity: 0.5 !important;
        }
        .table-add-button:hover {
          opacity: 1 !important;
          background: var(--bg-hover) !important;
          color: var(--text-primary) !important;
        }
        /* Override global width:100% so the table sizes to its content */
        .table-wrapper table {
          width: auto !important;
        }
        .table-wrapper table td,
        .table-wrapper table th {
          min-width: 80px;
          padding: 0.5rem 0.75rem;
        }
      `}</style>
    </NodeViewWrapper>
  )
}

export default TableView
