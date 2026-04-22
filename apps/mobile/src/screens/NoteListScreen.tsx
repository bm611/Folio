import { useCallback, useMemo, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'
import type { NoteFile, NoteFolder, TreeNode } from '@folio/shared'
import { filterTreeNodes, collectSubtreeIds } from '@folio/shared'
import { useNotes } from '../contexts/NotesContext'
import SearchBar from '../components/SearchBar'
import TreeNodeRow from '../components/TreeNodeRow'
import EmptyState from '../components/EmptyState'
import { useTheme } from '../theme'
import { IconButton, Text } from '../components/ui'

interface FlatItem {
  node: TreeNode
  depth: number
}

interface NoteListScreenProps {
  onNoteOpen?: () => void
}

function buildFlatList(nodes: TreeNode[], expandedFolders: Set<string>, depth = 0): FlatItem[] {
  const items: FlatItem[] = []
  for (const node of nodes) {
    items.push({ node, depth })
    if (node.type === 'folder' && expandedFolders.has(node.id) && node.children) {
      items.push(...buildFlatList(node.children, expandedFolders, depth + 1))
    }
  }
  return items
}

export default function NoteListScreen({ onNoteOpen }: NoteListScreenProps) {
  const theme = useTheme()
  const navigation = useNavigation<any>()
  const { tree, isLoading, isSyncing, createNote, createFolder, deleteTreeNode, renameTreeNode } = useNotes()
  const [search, setSearch] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  const filteredTree = useMemo(() => filterTreeNodes(tree, search), [tree, search])
  const listData = useMemo(
    () => buildFlatList(filteredTree, expandedFolders),
    [filteredTree, expandedFolders]
  )

  function handleCreateNote() {
    const note = createNote(null)
    onNoteOpen?.()
    navigation.getParent()?.navigate('Editor', { noteId: note.id, seedNote: note })
  }

  function handleFilePress(note: NoteFile) {
    onNoteOpen?.()
    navigation.getParent()?.navigate('Editor', { noteId: note.id })
  }

  function handleFolderPress(folder: NoteFolder) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folder.id)) next.delete(folder.id)
      else next.add(folder.id)
      return next
    })
  }

  function handleLongPress(node: TreeNode) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const isFolder = node.type === 'folder'

    Alert.alert(node.name || 'Untitled', undefined, [
      {
        text: 'Rename',
        onPress: () => {
          Alert.prompt(
            'Rename',
            undefined,
            (newName) => {
              if (newName?.trim()) renameTreeNode(node.id, newName.trim())
            },
            'plain-text',
            node.name
          )
        },
      },
      ...(isFolder
        ? [
            {
              text: 'New note inside',
              onPress: () => {
                const note = createNote(node.id)
                setExpandedFolders((prev) => new Set([...prev, node.id]))
                onNoteOpen?.()
                navigation.getParent()?.navigate('Editor', { noteId: note.id, seedNote: note })
              },
            },
          ]
        : []),
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => {
          const ids = collectSubtreeIds(tree, node.id)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          Alert.alert('Delete?', `This will delete "${node.name}"${isFolder ? ' and all its contents' : ''}.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteTreeNode(node.id, ids),
            },
          ])
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const renderItem = useCallback(
    ({ item }: { item: FlatItem }) => (
      <TreeNodeRow
        node={item.node}
        depth={item.depth}
        isExpanded={expandedFolders.has(item.node.id)}
        onFilePress={handleFilePress}
        onFolderPress={handleFolderPress}
        onLongPress={handleLongPress}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expandedFolders, tree]
  )

  function handleCreateFolder() {
    Alert.prompt('New Folder', 'Enter folder name', (name) => {
      if (name?.trim()) createFolder(null, name.trim())
    })
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bgDeep }}>
      <View style={[styles.header, { paddingHorizontal: theme.spacing[4] }]}>
        {isSyncing ? (
          <View style={[styles.syncPill, { backgroundColor: theme.colors.bgElevated }]}>
            <ActivityIndicator size="small" color={theme.colors.accent} style={{ transform: [{ scale: 0.7 }] }} />
            <Text variant="micro" tone="muted">
              Syncing
            </Text>
          </View>
        ) : <View />}
        <View style={styles.actions}>
          <IconButton
            glyph="✎"
            onPress={handleCreateFolder}
            accessibilityLabel="New folder"
          />
          <IconButton
            glyph="+"
            onPress={handleCreateNote}
            accessibilityLabel="New note"
          />
        </View>
      </View>

      <SearchBar value={search} onChange={setSearch} />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.accent} size="large" />
        </View>
      ) : listData.length === 0 ? (
        <EmptyState onCreateNote={handleCreateNote} />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.node.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        />
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 2,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 100,
  },
})
