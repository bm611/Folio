import { ScrollView, StyleSheet, View } from 'react-native'

import { Button, Card, Screen, Text } from '../components/ui'
import { useTheme } from '../theme'

const FEATURES = [
  {
    accent: 'Editor',
    title: 'Write without friction',
    description: 'Headings, lists, code, quotes, and task lists render as you type.',
  },
  {
    accent: 'Offline',
    title: 'Local-first by default',
    description: 'Capture ideas instantly, then sync them across devices when you are ready.',
  },
  {
    accent: 'AI',
    title: 'Ask AI about your notes',
    description: 'Use your writing as context for summaries, rewrites, and brainstorming.',
  },
  {
    accent: 'Library',
    title: 'Keep everything organized',
    description: 'Folders, quick note creation, and a focused sidebar keep the structure simple.',
  },
]

export default function WelcomeScreen({ navigation }: any) {
  const theme = useTheme()

  return (
    <Screen safeEdges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            gap: theme.spacing[5],
            paddingHorizontal: theme.spacing[5],
            paddingTop: theme.spacing[6],
            paddingBottom: theme.spacing[6],
          },
        ]}
      >
        <View style={{ gap: theme.spacing[3] }}>
          <Text variant="micro" tone="accent" style={{ letterSpacing: 1.6, textTransform: 'uppercase' }}>
            Folio mobile
          </Text>
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.displaySemibold,
              fontSize: 44,
              lineHeight: 52,
              letterSpacing: -1,
            }}
          >
            Notes that feel calm, fast, and yours.
          </Text>
          <Text variant="bodyLarge" tone="secondary" style={{ maxWidth: 340 }}>
            A focused note space with rich markdown, AI assistance, and optional sync across devices.
          </Text>
        </View>

        <Card elevated style={{ gap: theme.spacing[3] }}>
          <Text variant="micro" tone="muted" style={{ letterSpacing: 1.4, textTransform: 'uppercase' }}>
            Preview
          </Text>
          <View style={{ gap: theme.spacing[2] }}>
            <Text
              style={{
                color: theme.colors.accent,
                fontFamily: theme.fonts.displaySemibold,
                fontSize: 26,
                lineHeight: 32,
              }}
            >
              Weekly Planning
            </Text>
            <Text variant="body" tone="secondary">
              - Ship mobile polish
            </Text>
            <Text variant="body" tone="secondary">
              - Review roadmap notes
            </Text>
            <Text variant="body" tone="secondary">
              {'> Keep the writing flow lightweight and readable'}
            </Text>
          </View>
        </Card>

        <View style={{ gap: theme.spacing[3] }}>
          {FEATURES.map((feature) => (
            <Card key={feature.title} style={{ gap: theme.spacing[2] }}>
              <Text variant="micro" tone="accent" style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {feature.accent}
              </Text>
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fonts.displaySemibold,
                  fontSize: 22,
                  lineHeight: 28,
                }}
              >
                {feature.title}
              </Text>
              <Text variant="body" tone="secondary">
                {feature.description}
              </Text>
            </Card>
          ))}
        </View>

        <View style={{ gap: theme.spacing[3], marginTop: theme.spacing[2] }}>
          <Button
            label="Create account"
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('Login', { initialTab: 'signup' })}
          />
          <Button
            label="Sign in to sync"
            variant="subtle"
            size="lg"
            fullWidth
            onPress={() => navigation.navigate('Login', { initialTab: 'signin' })}
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
})
