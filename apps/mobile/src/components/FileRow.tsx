import { TouchableOpacity, View, StyleSheet } from 'react-native'
import type { NoteFile } from '@folio/shared'
import { formatCreatedAt } from '@folio/shared'
import { useTheme } from '../theme'
import { Text } from './ui'

interface Props {
  note: NoteFile
  depth: number
  onPress: () => void
  onLongPress: () => void
}

export default function FileRow({ note, depth, onPress, onLongPress }: Props) {
  const theme = useTheme()

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          paddingLeft: theme.spacing[5] + depth * theme.spacing[4],
          paddingRight: theme.spacing[4],
          paddingVertical: theme.spacing[3] + 2,
          borderBottomColor: theme.colors.borderSubtle,
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.65}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.dot,
            { backgroundColor: theme.colors.accent, opacity: 0.75 },
          ]}
        />
        <View style={styles.textBlock}>
          <Text variant="body" weight="medium" numberOfLines={1}>
            {note.title || note.name || 'Untitled'}
          </Text>
        </View>
        <Text variant="micro" tone="muted">
          {formatCreatedAt(note.updatedAt || note.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  textBlock: {
    flex: 1,
  },
})
