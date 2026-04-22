import AsyncStorage from '@react-native-async-storage/async-storage'
import type { TreeNode } from '@folio/shared'

function treeKey(userId: string) {
  return `canvas-tree:${userId}`
}
function pendingUpsertsKey(userId: string) {
  return `canvas-pending-upserts:${userId}`
}
function pendingDeletesKey(userId: string) {
  return `canvas-pending-delete:${userId}`
}

export async function getTree(userId: string): Promise<TreeNode[] | null> {
  try {
    const raw = await AsyncStorage.getItem(treeKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as TreeNode[]
  } catch {
    return null
  }
}

export async function saveTree(userId: string, tree: TreeNode[]): Promise<void> {
  await AsyncStorage.setItem(treeKey(userId), JSON.stringify(tree))
}

export async function clearTree(userId: string): Promise<void> {
  await AsyncStorage.removeItem(treeKey(userId))
}

export async function getPendingUpserts(userId: string): Promise<Record<string, unknown>[]> {
  try {
    const raw = await AsyncStorage.getItem(pendingUpsertsKey(userId))
    if (!raw) return []
    return JSON.parse(raw) as Record<string, unknown>[]
  } catch {
    return []
  }
}

export async function savePendingUpserts(userId: string, items: Record<string, unknown>[]): Promise<void> {
  await AsyncStorage.setItem(pendingUpsertsKey(userId), JSON.stringify(items))
}

export async function getPendingDeletes(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(pendingDeletesKey(userId))
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

export async function savePendingDeletes(userId: string, ids: string[]): Promise<void> {
  await AsyncStorage.setItem(pendingDeletesKey(userId), JSON.stringify(ids))
}
