import { useEffect, useRef, useState, useCallback } from 'react'
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../navigation/AppNavigator'
import { useNotes } from '../contexts/NotesContext'
import TenTapEditor from '../components/TenTapEditor'

type Props = NativeStackScreenProps<AppStackParamList, 'Editor'>

export default function EditorScreen({ route, navigation }: Props) {
  const { noteId } = route.params
  const { findNote, updateNote } = useNotes()

  const note = findNote(noteId)
  const [title, setTitle] = useState(note?.title || note?.name || '')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContent = useRef(note?.content || '')

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TextInput
          value={title}
          onChangeText={(t) => {
            setTitle(t)
            scheduleSave(t, latestContent.current)
          }}
          style={headerStyles.titleInput}
          placeholder="Untitled"
          placeholderTextColor="#555"
          returnKeyType="done"
          blurOnSubmit
        />
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('AiChat', { noteId })}
          style={headerStyles.aiBtn}
        >
          <Text style={headerStyles.aiBtnText}>✦ AI</Text>
        </TouchableOpacity>
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  function scheduleSave(newTitle: string, newContent: string, newContentDoc?: object) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateNote(noteId, {
        title: newTitle,
        name: newTitle,
        content: newContent,
        ...(newContentDoc ? { contentDoc: newContentDoc as Record<string, unknown>, editorVersion: 2 } : {}),
      })
    }, 500)
  }

  const handleContentChange = useCallback(
    (html: string, json: object) => {
      latestContent.current = html
      scheduleSave(title, html, json)
    },
    [title]
  )

  if (!note) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>Note not found.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TenTapEditor
        initialContent={note.content || ''}
        initialContentDoc={note.contentDoc}
        onChange={handleContentChange}
        placeholder="Start writing…"
        style={styles.editor}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  editor: {
    flex: 1,
  },
})

const headerStyles = StyleSheet.create({
  titleInput: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    minWidth: 160,
    maxWidth: 220,
  },
  aiBtn: {
    marginRight: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  aiBtnText: {
    color: '#e07a8a',
    fontSize: 13,
    fontWeight: '600',
  },
})
