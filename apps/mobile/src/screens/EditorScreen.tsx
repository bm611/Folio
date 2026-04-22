import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import type { NoteFile } from '@folio/shared'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../navigation/AppNavigator'
import { useNotes } from '../contexts/NotesContext'
import TenTapEditor from '../components/TenTapEditor'
import { useTheme } from '../theme'
import { Screen, Text, IconButton } from '../components/ui'
import { docToMarkdown, markdownToHtml } from '../lib/markdown'

type Props = NativeStackScreenProps<AppStackParamList, 'Editor'>

function countWords(content: string): number {
  if (!content) return 0
  const text = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_#[\]()>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return 0
  return text.split(' ').length
}

export default function EditorScreen({ route, navigation }: Props) {
  const theme = useTheme()
  const { noteId, seedNote } = route.params
  const { findNote, updateNote } = useNotes()

  const note = (findNote(noteId) ?? seedNote ?? null) as NoteFile | null
  const [title, setTitle] = useState(note?.title || note?.name || '')
  const [content, setContent] = useState(note?.content || '')
  const [contentDoc, setContentDoc] = useState<Record<string, unknown> | undefined>(
    note?.contentDoc && typeof note.contentDoc === 'object' ? note.contentDoc : undefined
  )

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContent = useRef(note?.content || '')
  const latestContentDoc = useRef<Record<string, unknown> | undefined>(
    note?.contentDoc && typeof note.contentDoc === 'object' ? note.contentDoc : undefined
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.colors.bgDeep },
      headerTintColor: theme.colors.textPrimary,
      headerTitle: '',
      headerShadowVisible: false,
      headerBackTitle: '',
      headerRight: () => (
        <IconButton
          glyph="✦"
          tone="accent"
          variant="ghost"
          onPress={() => navigation.navigate('HomeTabs', { screen: 'AiTab', params: { noteId } })}
          accessibilityLabel="AI chat"
        />
      ),
    })
  }, [navigation, theme, noteId])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  function scheduleSave(newTitle: string, newContent: string, newDoc?: Record<string, unknown>) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateNote(noteId, {
        title: newTitle,
        name: newTitle,
        content: newContent,
        contentDoc: newDoc as Record<string, unknown> | undefined,
        editorVersion: newDoc ? 2 : undefined,
      })
    }, 500)
  }

  const handleContentChange = useCallback(
    (_html: string, json: object) => {
      const nextDoc = json as Record<string, unknown>
      const markdown = docToMarkdown(nextDoc)
      latestContent.current = markdown
      latestContentDoc.current = nextDoc
      setContent(markdown)
      setContentDoc(nextDoc)
      scheduleSave(title, markdown, nextDoc)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title]
  )

  if (!note) {
    return (
      <Screen>
        <View style={styles.notFound}>
          <Text variant="heading" tone="secondary" center>
            Note not found
          </Text>
        </View>
      </Screen>
    )
  }

  const words = countWords(content)
  const readTime = Math.max(1, Math.round(words / 220))

  return (
    <Screen surface="primary">
      <View style={{ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[2] }}>
        <TextInput
          value={title}
          onChangeText={(t) => {
            setTitle(t)
            scheduleSave(t, latestContent.current, latestContentDoc.current)
          }}
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.fonts.displaySemibold,
            fontSize: 30,
            letterSpacing: -0.5,
            paddingVertical: 6,
          }}
          placeholder="Untitled"
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.accent}
          returnKeyType="done"
          blurOnSubmit
          multiline={false}
        />
        <View
          style={[
            styles.statsRow,
            { borderBottomColor: theme.colors.borderSubtle, paddingVertical: theme.spacing[2] },
          ]}
        >
          <Text variant="micro" tone="muted" style={{ fontFamily: theme.fonts.mono }}>
            {words} words
          </Text>
          <Text variant="micro" tone="muted" style={{ fontFamily: theme.fonts.mono }}>
            ·
          </Text>
          <Text variant="micro" tone="muted" style={{ fontFamily: theme.fonts.mono }}>
            {readTime} min read
          </Text>
        </View>
      </View>

      <TenTapEditor
        initialContent={contentDoc ? '' : markdownToHtml(content)}
        initialContentDoc={contentDoc}
        onChange={handleContentChange}
        placeholder="Start writing…"
        style={styles.editor}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
