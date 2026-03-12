export function insertNode(tree, parentId, newNode) {
  if (parentId === null) {
    return [...tree, newNode]
  }

  return tree.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children || []), newNode] }
    }

    if (node.children) {
      return { ...node, children: insertNode(node.children, parentId, newNode) }
    }

    return node
  })
}

export function deleteNode(tree, id) {
  return tree
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children ? { ...node, children: deleteNode(node.children, id) } : node
    )
}

export function renameNode(tree, id, name) {
  return tree.map((node) => {
    if (node.id === id) {
      return { ...node, name, title: name }
    }

    if (node.children) {
      return { ...node, children: renameNode(node.children, id, name) }
    }

    return node
  })
}

export function updateFileNode(tree, id, updates) {
  return tree.map((node) => {
    if (node.id === id) {
      return { ...node, ...updates }
    }

    if (node.children) {
      return { ...node, children: updateFileNode(node.children, id, updates) }
    }

    return node
  })
}

export function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }

    if (node.children) {
      const match = findNode(node.children, id)
      if (match) {
        return match
      }
    }
  }

  return null
}

export function flattenTree(nodes) {
  let result = []

  for (const node of nodes) {
    if (node.type === 'file') {
      result.push(node)
    }

    if (node.children) {
      result = result.concat(flattenTree(node.children))
    }
  }

  return result
}

export function sortTreeNodes(nodes) {
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
      node.type === 'folder' && node.children
        ? { ...node, children: sortTreeNodes(node.children) }
        : node
    )
}

export function filterTreeNodes(nodes, query) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return sortTreeNodes(nodes)
  }

  const filterNodes = (branch) => {
    const result = []

    for (const node of branch) {
      if (node.type === 'file' && node.name.toLowerCase().includes(normalizedQuery)) {
        result.push({ ...node })
        continue
      }

      if (node.type === 'folder') {
        const filteredChildren = filterNodes(node.children || [])
        if (filteredChildren.length > 0 || node.name.toLowerCase().includes(normalizedQuery)) {
          result.push({ ...node, children: filteredChildren })
        }
      }
    }

    return result
  }

  return sortTreeNodes(filterNodes(nodes))
}

export function getVisibleFiles(nodes, expanded) {
  let result = []

  for (const node of nodes) {
    if (node.type === 'file') {
      result.push(node)
    }

    if (node.type === 'folder' && expanded.has(node.id) && node.children) {
      result = result.concat(getVisibleFiles(node.children, expanded))
    }
  }

  return result
}
