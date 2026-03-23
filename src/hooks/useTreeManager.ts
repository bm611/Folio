import { useCallback, useMemo, useState } from 'react'
import type { TreeNode, FlatNode, NoteFile, NoteFolder } from '../types'

export interface TreeManagerResult {
  tree: TreeNode[]
  setTree: (tree: TreeNode[]) => void

  findNode: (id: string) => TreeNode | null
  getParentId: (nodeId: string) => string | null
  insertNode: (parentId: string | null, newNode: TreeNode) => void
  deleteNode: (id: string) => void
  renameNode: (id: string, name: string) => void
  updateNode: (id: string, updates: Partial<TreeNode> & Record<string, unknown>) => void
  moveNode: (nodeId: string, newParentId: string | null) => void

  collectSubtreeIds: (id: string) => string[]
  flattenNodesForSync: () => FlatNode[]
}

function buildNodeMap(tree: TreeNode[]): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>()
  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      map.set(node.id, node)
      if (node.type === 'folder' && node.children) {
        traverse(node.children)
      }
    }
  }
  traverse(tree)
  return map
}

function buildFlatNodes(tree: TreeNode[], parentId: string | null = null): FlatNode[] {
  let result: FlatNode[] = []
  for (const node of tree) {
    const { children: _, ...rest } = node as TreeNode & { children?: TreeNode[] }
    result.push({ ...rest, parentId } as FlatNode)
    if (node.type === 'folder' && node.children?.length) {
      result = result.concat(buildFlatNodes(node.children, node.id))
    }
  }
  return result
}

function doFindNode(nodeMap: Map<string, TreeNode>, id: string): TreeNode | null {
  return nodeMap.get(id) ?? null
}

function doGetParentId(nodeMap: Map<string, TreeNode>, nodeId: string): string | null {
  for (const [id, node] of nodeMap) {
    if (node.type === 'folder' && node.children?.some((c) => c.id === nodeId)) {
      return id
    }
  }
  return null
}

function doInsertNode(tree: TreeNode[], parentId: string | null, newNode: TreeNode): TreeNode[] {
  if (parentId === null) {
    return [...tree, newNode]
  }
  return tree.map((node) => {
    if (node.id === parentId) {
      const children = 'children' in node ? node.children : []
      return { ...node, children: [...children, newNode] }
    }
    if ('children' in node && node.children) {
      return { ...node, children: doInsertNode(node.children, parentId, newNode) }
    }
    return node
  })
}

function doDeleteNode(tree: TreeNode[], id: string): TreeNode[] {
  return tree
    .filter((node) => node.id !== id)
    .map((node) =>
      'children' in node && node.children ? { ...node, children: doDeleteNode(node.children, id) } : node
    )
}

function doRenameNode(tree: TreeNode[], id: string, name: string): TreeNode[] {
  return tree.map((node) => {
    if (node.id === id) {
      return { ...node, name, title: name }
    }
    if ('children' in node && node.children) {
      return { ...node, children: doRenameNode(node.children, id, name) }
    }
    return node
  })
}

function doUpdateNode(
  tree: TreeNode[],
  id: string,
  updates: Partial<TreeNode> & Record<string, unknown>
): TreeNode[] {
  return tree.map((node) => {
    if (node.id === id) {
      return { ...node, ...updates } as TreeNode
    }
    if ('children' in node && node.children) {
      return { ...node, children: doUpdateNode(node.children, id, updates) } as TreeNode
    }
    return node
  })
}

function doCollectSubtreeIds(nodeMap: Map<string, TreeNode>, id: string): string[] {
  const node = nodeMap.get(id)
  if (!node) return []
  const ids: string[] = [id]
  if (node.type === 'folder' && node.children) {
    for (const child of node.children) {
      ids.push(...doCollectSubtreeIds(nodeMap, child.id))
    }
  }
  return ids
}

function doMoveNode(
  tree: TreeNode[],
  nodeMap: Map<string, TreeNode>,
  nodeId: string,
  newParentId: string | null
): TreeNode[] {
  const subtreeIds = new Set(doCollectSubtreeIds(nodeMap, nodeId))
  if (newParentId !== null && subtreeIds.has(newParentId)) {
    return tree
  }
  const nodeToMove = nodeMap.get(nodeId)
  if (!nodeToMove) return tree
  const treeWithoutNode = doDeleteNode(tree, nodeId)
  const updatedNode = { ...nodeToMove, parentId: newParentId } as TreeNode
  return doInsertNode(treeWithoutNode, newParentId, updatedNode)
}

export function useTreeManager(initialTree: TreeNode[] = []): TreeManagerResult {
  const [tree, setTreeState] = useState<TreeNode[]>(initialTree)

  const nodeMap = useMemo(() => buildNodeMap(tree), [tree])
  const flatNodes = useMemo(() => buildFlatNodes(tree), [tree])

  const setTree = useCallback((newTree: TreeNode[]) => {
    setTreeState(newTree)
  }, [])

  const findNode = useCallback((id: string): TreeNode | null => {
    return doFindNode(nodeMap, id)
  }, [nodeMap])

  const getParentId = useCallback((nodeId: string): string | null => {
    return doGetParentId(nodeMap, nodeId)
  }, [nodeMap])

  const insertNode = useCallback((parentId: string | null, newNode: TreeNode) => {
    setTreeState((prev) => doInsertNode(prev, parentId, newNode))
  }, [])

  const deleteNode = useCallback((id: string) => {
    setTreeState((prev) => doDeleteNode(prev, id))
  }, [])

  const renameNode = useCallback((id: string, name: string) => {
    setTreeState((prev) => doRenameNode(prev, id, name))
  }, [])

  const updateNode = useCallback(
    (id: string, updates: Partial<TreeNode> & Record<string, unknown>) => {
      setTreeState((prev) => doUpdateNode(prev, id, updates))
    },
    []
  )

  const moveNode = useCallback((nodeId: string, newParentId: string | null) => {
    setTreeState((prev) => {
      const nodeMapSnapshot = buildNodeMap(prev)
      return doMoveNode(prev, nodeMapSnapshot, nodeId, newParentId)
    })
  }, [])

  const collectSubtreeIds = useCallback((id: string): string[] => {
    return doCollectSubtreeIds(nodeMap, id)
  }, [nodeMap])

  const flattenNodesForSync = useCallback((): FlatNode[] => {
    return flatNodes
  }, [flatNodes])

  return useMemo(
    () => ({
      tree,
      setTree,
      findNode,
      getParentId,
      insertNode,
      deleteNode,
      renameNode,
      updateNode,
      moveNode,
      collectSubtreeIds,
      flattenNodesForSync,
    }),
    [
      tree,
      setTree,
      findNode,
      getParentId,
      insertNode,
      deleteNode,
      renameNode,
      updateNode,
      moveNode,
      collectSubtreeIds,
      flattenNodesForSync,
    ]
  )
}

export type { TreeNode, FlatNode, NoteFile, NoteFolder }
