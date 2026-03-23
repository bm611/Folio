import { useState, useMemo } from 'react'
import { Cancel01Icon, Folder01Icon, FolderOpenIcon } from '@hugeicons/core-free-icons'
import Icon from './Icon'
import type { TreeNode } from '../types'
import { collectSubtreeIds } from '../utils/tree'

interface MoveToModalProps {
  open: boolean
  nodeId: string
  tree: TreeNode[]
  currentParentId: string | null
  onConfirm: (newParentId: string | null) => void
  onClose: () => void
}

interface FlattenedFolder {
  id: string
  name: string
  depth: number
  isDisabled: boolean
}

function FolderItem({
  folder,
  isSelected,
  isCurrentParent,
  onSelect,
}: {
  folder: FlattenedFolder
  isSelected: boolean
  isCurrentParent: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={folder.isDisabled}
      className={`mt-move-item ${isSelected ? 'selected' : ''} ${folder.isDisabled ? 'disabled' : ''} ${isCurrentParent ? 'current-parent' : ''}`}
      onClick={onSelect}
    >
      <span className="mt-move-icon">
        <Icon
          icon={isSelected || isCurrentParent ? FolderOpenIcon : Folder01Icon}
          size={18}
          strokeWidth={1.5}
        />
      </span>
      <span className="mt-move-name">{folder.name}</span>
      {isCurrentParent && <span className="mt-move-badge">Current</span>}
    </button>
  )
}

export default function MoveToModal({
  open,
  nodeId,
  tree,
  currentParentId,
  onConfirm,
  onClose,
}: MoveToModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(() => currentParentId)

  const disabledIds = useMemo(() => {
    return new Set(collectSubtreeIds(tree, nodeId))
  }, [tree, nodeId])

  const flattenedFolders = useMemo((): FlattenedFolder[] => {
    const result: FlattenedFolder[] = []

    const traverse = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        if (node.type === 'folder') {
          const isDisabled = disabledIds.has(node.id)
          result.push({ id: node.id, name: node.name, depth, isDisabled })
          if (node.children) {
            traverse(node.children, depth + 1)
          }
        }
      }
    }

    traverse(tree, 0)
    return result
  }, [tree, disabledIds])

  if (!open) return null

  const handleConfirm = () => {
    onConfirm(selectedId)
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Move to folder"
        className="fixed left-1/2 top-1/2 z-[101] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-2xl"
      >
        <div className="mt-modal">
          <div className="mt-modal-header">
            <h2 className="mt-modal-title">Move to</h2>
            <button type="button" className="mt-modal-close" onClick={onClose} aria-label="Close">
              <Icon icon={Cancel01Icon} size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="mt-modal-body">
            <div className="mt-move-list">
              <button
                type="button"
                className={`mt-move-item ${selectedId === null ? 'selected' : ''}`}
                onClick={() => setSelectedId(null)}
              >
                <span className="mt-move-icon">
                  <Icon
                    icon={Folder01Icon}
                    size={18}
                    strokeWidth={1.5}
                    style={{ opacity: selectedId === null ? 1 : 0.5 }}
                  />
                </span>
                <span className="mt-move-name">Move to Root</span>
              </button>

              {flattenedFolders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isSelected={selectedId === folder.id}
                  isCurrentParent={folder.id === currentParentId}
                  onSelect={() => setSelectedId(folder.id)}
                />
              ))}
            </div>
          </div>

          <div className="mt-modal-footer">
            <button type="button" className="mt-btn mt-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="mt-btn mt-btn-confirm"
              onClick={handleConfirm}
              disabled={selectedId === currentParentId}
            >
              Move Here
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
