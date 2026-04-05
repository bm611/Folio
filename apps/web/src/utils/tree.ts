import type { TreeNode, FlatNode } from '../types'

export function insertNode(tree: TreeNode[], parentId: string | null, newNode: TreeNode): TreeNode[] {
  if (parentId === null) {
    return [...tree, newNode]
  }

  return tree.map((node) => {
    if (node.id === parentId) {
      const children = 'children' in node ? node.children : []
      return { ...node, children: [...children, newNode] }
    }

    if ('children' in node && node.children) {
      return { ...node, children: insertNode(node.children, parentId, newNode) }
    }

    return node
  })
}

export function deleteNode(tree: TreeNode[], id: string): TreeNode[] {
  return tree
    .filter((node) => node.id !== id)
    .map((node) =>
      'children' in node && node.children ? { ...node, children: deleteNode(node.children, id) } : node
    )
}

export function renameNode(tree: TreeNode[], id: string, name: string): TreeNode[] {
  return tree.map((node) => {
    if (node.id === id) {
      return { ...node, name, title: name }
    }

    if ('children' in node && node.children) {
      return { ...node, children: renameNode(node.children, id, name) }
    }

    return node
  })
}

export function updateFileNode(tree: TreeNode[], id: string, updates: Partial<TreeNode> & Record<string, unknown>): TreeNode[] {
  return tree.map((node) => {
    if (node.id === id) {
      return { ...node, ...updates } as TreeNode
    }

    if ('children' in node && node.children) {
      return { ...node, children: updateFileNode(node.children, id, updates) } as TreeNode
    }

    return node
  })
}

export function findFile(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id && node.type === 'file') {
      return node
    }

    if ('children' in node && node.children) {
      const match = findFile(node.children, id)
      if (match) {
        return match
      }
    }
  }

  return null
}

export function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }

    if ('children' in node && node.children) {
      const match = findNode(node.children, id)
      if (match) {
        return match
      }
    }
  }

  return null
}

export function flattenTree(nodes: TreeNode[]): TreeNode[] {
  let result: TreeNode[] = []

  for (const node of nodes) {
    if (node.type === 'file') {
      result.push(node)
    }

    if ('children' in node && node.children) {
      result = result.concat(flattenTree(node.children))
    }
  }

  return result
}

export function flattenNodes(nodes: TreeNode[], parentId: string | null = null): FlatNode[] {
  let result: FlatNode[] = []

  for (const node of nodes) {
    const { children: _, ...rest } = node as TreeNode & { children?: TreeNode[] }
    result.push({ ...rest, parentId } as FlatNode)

    if ('children' in node && node.children?.length) {
      result = result.concat(flattenNodes(node.children, node.id))
    }
  }

  return result
}

export function collectSubtreeIds(nodes: TreeNode[], id: string): string[] {
  const match = findNode(nodes, id)

  if (!match) {
    return []
  }

  return flattenNodes([match]).map((node) => node.id)
}

export function sortTreeNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes]
    .sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') {
        return -1
      }

      if (a.type !== 'folder' && b.type === 'folder') {
        return 1
      }

      return a.name.localeCompare(b.name)
    })
    .map((node) =>
      node.type === 'folder' && 'children' in node && node.children
        ? { ...node, children: sortTreeNodes(node.children) }
        : node
    )
}

export function filterTreeNodes(nodes: TreeNode[], query: string): TreeNode[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return sortTreeNodes(nodes)
  }

  const filterNodes = (branch: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = []

    for (const node of branch) {
      if (node.type === 'file' && node.name.toLowerCase().includes(normalizedQuery)) {
        result.push({ ...node })
        continue
      }

      if (node.type === 'folder') {
        const children = 'children' in node ? node.children || [] : []
        const filteredChildren = filterNodes(children)
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(normalizedQuery)) {
          result.push({ ...node, children: filteredChildren })
        }
      }
    }

    return result
  }

  return sortTreeNodes(filterNodes(nodes))
}

export function getVisibleFiles(nodes: TreeNode[], expanded: Set<string>): TreeNode[] {
  let result: TreeNode[] = []

  for (const node of nodes) {
    if (node.type === 'file') {
      result.push(node)
    }

    if (node.type === 'folder' && expanded.has(node.id) && 'children' in node && node.children) {
      result = result.concat(getVisibleFiles(node.children, expanded))
    }
  }

  return result
}

export function getParentId(tree: TreeNode[], nodeId: string): string | null {
  for (const node of tree) {
    if ('children' in node && node.children) {
      for (const child of node.children) {
        if (child.id === nodeId) {
          return node.id
        }
      }

      const deeper = getParentId(node.children, nodeId)
      if (deeper !== null) {
        return deeper
      }
    }
  }

  return null
}

export function getBreadcrumbPath(tree: TreeNode[], nodeId: string): TreeNode[] {
  const path: TreeNode[] = []
  let currentId: string | null = nodeId
  const visited = new Set<string>()

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const parentId = getParentId(tree, currentId)
    if (parentId) {
      const parent = findNode(tree, parentId)
      if (parent) {
        path.unshift(parent)
        currentId = parentId
      } else {
        break
      }
    } else {
      break
    }
  }

  return path
}

export function moveNode(tree: TreeNode[], nodeId: string, newParentId: string | null): TreeNode[] {
  const subtreeIds = new Set(collectSubtreeIds(tree, nodeId))

  if (newParentId !== null && subtreeIds.has(newParentId)) {
    return tree
  }

  const nodeToMove = findNode(tree, nodeId)
  if (!nodeToMove) return tree

  const treeWithoutNode = deleteNode(tree, nodeId)
  return insertNode(treeWithoutNode, newParentId, { ...nodeToMove, parentId: newParentId })
}

export function rebuildTreeFromFlat(flatItems: FlatNode[]): TreeNode[] {
  const folderMap: Record<string, TreeNode & { children: TreeNode[] }> = {}

  for (const item of flatItems) {
    if (item.type === 'folder') {
      const { parentId: _, ...rest } = item
      folderMap[item.id] = { ...rest, children: [] } as TreeNode & { children: TreeNode[] }
    }
  }

  const root: TreeNode[] = []

  for (const item of flatItems) {
    const { parentId, ...rest } = item

    if (item.type === 'folder') {
      const folderNode = folderMap[item.id]!
      if (parentId !== null && folderMap[parentId]) {
        folderMap[parentId]!.children.push(folderNode)
      } else {
        root.push(folderNode)
      }
    } else {
      if (parentId !== null && folderMap[parentId]) {
        folderMap[parentId]!.children.push(rest as unknown as TreeNode)
      } else {
        root.push(rest as unknown as TreeNode)
      }
    }
  }

  return root
}
