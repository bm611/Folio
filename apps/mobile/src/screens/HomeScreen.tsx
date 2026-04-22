// @ts-nocheck
import { useMemo, useState } from 'react'
import { View, TouchableOpacity, FlatList, StyleSheet, Modal, Pressable, useWindowDimensions } from 'react-native'
import type { NoteFile, TreeNode } from '@folio/shared'
import { useNotes } from '../contexts/NotesContext'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../theme'
import { Screen, Text, Card } from '../components/ui'
import NoteListScreen from './NoteListScreen'

function collectFiles(nodes: TreeNode[]): NoteFile[] {
  const files: NoteFile[] = []
  for (const node of nodes) {
    if (node.type === 'file') files.push(node as NoteFile)
    if (node.type === 'folder' && node.children) files.push(...collectFiles(node.children))
  }
  return files
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme()
  const { width } = useWindowDimensions()
  const { tree, createNote } = useNotes()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const allFiles = useMemo(() => collectFiles(tree), [tree])
  const recentNotes = useMemo(
    () =>
      [...allFiles]
        .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''))
        .slice(0, 4),
    [allFiles]
  )

  function handleCreateNote() {
    const note = createNote(null)
    navigation.getParent()?.navigate('Editor', { noteId: note.id, seedNote: note })
  }

  function handleOpenNote(note: NoteFile) {
    navigation.getParent()?.navigate('Editor', { noteId: note.id })
  }

  const firstName = user?.email?.split('@')[0] ?? ''

  return (
    <Screen safeEdges={['top']}>
      <View style={{ flex: 1, paddingHorizontal: theme.spacing[5] }}>
        {/* Header */}
        <View style={{ paddingTop: theme.spacing[5], paddingBottom: theme.spacing[4], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text variant="small" tone="muted" style={{ fontFamily: theme.fonts.mono, letterSpacing: 1 }}>
              {getGreeting()}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.displaySemibold,
                fontSize: 32,
                color: theme.colors.textPrimary,
                letterSpacing: -0.5,
                marginTop: 4,
              }}
            >
              {firstName || 'Writer'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={8} style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 24, color: theme.colors.textPrimary }}>☰</Text>
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { gap: theme.spacing[3] }]}>
          <Card elevated style={[styles.statCard, { flex: 1 }]}>
            <Text
              style={{
                fontFamily: theme.fonts.displaySemibold,
                fontSize: 28,
                color: theme.colors.accent,
                letterSpacing: -0.5,
              }}
            >
              {allFiles.length}
            </Text>
            <Text variant="micro" tone="muted">
              Notes
            </Text>
          </Card>
          <Card elevated style={[styles.statCard, { flex: 1 }]}>
            <Text
              style={{
                fontFamily: theme.fonts.displaySemibold,
                fontSize: 28,
                color: theme.colors.colorH3,
                letterSpacing: -0.5,
              }}
            >
              {tree.filter((n) => n.type === 'folder').length}
            </Text>
            <Text variant="micro" tone="muted">
              Folders
            </Text>
          </Card>
        </View>

        {/* Quick actions */}
        <View style={{ marginTop: theme.spacing[6] }}>
          <Text variant="micro" tone="muted" style={{ letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: theme.spacing[3], marginLeft: 2 }}>
            Quick actions
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.colors.accent,
                  borderRadius: theme.radius.md,
                  flex: 1,
                },
              ]}
              onPress={handleCreateNote}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#fff', fontSize: 22, marginBottom: 2 }}>+</Text>
              <Text variant="label" weight="semibold" style={{ color: '#fff' }}>
                New note
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.colors.bgSurface,
                  borderColor: theme.colors.borderSubtle,
                  borderWidth: 1,
                  borderRadius: theme.radius.md,
                  flex: 1,
                },
              ]}
              onPress={() => navigation.navigate('AiTab' as any)}
              activeOpacity={0.85}
            >
              <Text style={{ color: theme.colors.accent, fontSize: 22, marginBottom: 2 }}>✦</Text>
              <Text variant="label" weight="semibold" tone="secondary">
                Ask AI
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent notes — just titles, no previews */}
        {recentNotes.length > 0 && (
          <View style={{ marginTop: theme.spacing[6], flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[3] }}>
              <Text variant="micro" tone="muted" style={{ letterSpacing: 1.4, textTransform: 'uppercase', marginLeft: 2 }}>
                Recent
              </Text>
              <TouchableOpacity onPress={() => setSidebarOpen(true)} hitSlop={8}>
                <Text variant="small" tone="accent">
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentNotes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.recentItem,
                    {
                      borderBottomColor: theme.colors.borderSubtle,
                    },
                  ]}
                  onPress={() => handleOpenNote(item)}
                  activeOpacity={0.65}
                >
                  <View
                    style={[styles.dot, { backgroundColor: theme.colors.accent, opacity: 0.7 }]}
                  />
                  <Text variant="body" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
                    {item.title || item.name || 'Untitled'}
                  </Text>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          </View>
        )}
      </View>

      <Modal
        visible={sidebarOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setSidebarOpen(false)}
      >
        <View style={styles.sidebarOverlay}>
          <View
            style={[
              styles.sidebarPanel,
              {
                width: Math.min(width * 0.88, 360),
                backgroundColor: theme.colors.bgDeep,
                borderRightColor: theme.colors.borderSubtle,
              },
            ]}
          >
            <View
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: theme.spacing[4],
                paddingTop: theme.spacing[6],
                paddingBottom: theme.spacing[3],
              }}
            >
              <View>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.fonts.displaySemibold,
                    fontSize: 26,
                    lineHeight: 32,
                  }}
                >
                  Folio
                </Text>
                <Text variant="micro" tone="muted" style={{ marginTop: 2 }}>
                  Your notes
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSidebarOpen(false)} hitSlop={8}>
                <Text style={{ fontSize: 18, color: theme.colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
            <NoteListScreen onNoteOpen={() => setSidebarOpen(false)} />
          </View>
          <Pressable style={styles.sidebarBackdrop} onPress={() => setSidebarOpen(false)} />
        </View>
      </Modal>
    </Screen>
  )
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sidebarOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  sidebarBackdrop: {
    flex: 1,
  },
  sidebarPanel: {
    flexShrink: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
})
