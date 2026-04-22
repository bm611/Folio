import { useEffect, useState } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../theme'
import { Button, Input, Screen, Text } from '../components/ui'

type Tab = 'signin' | 'signup'

export default function LoginScreen({ navigation, route }: any) {
  const theme = useTheme()
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [tab, setTab] = useState<Tab>(route?.params?.initialTab === 'signup' ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const nextTab = route?.params?.initialTab
    if (nextTab === 'signin' || nextTab === 'signup') {
      setTab(nextTab)
      setError(null)
      setSuccessMsg(null)
    }
  }, [route?.params?.initialTab])

  async function handleSubmit() {
    setError(null)
    setSuccessMsg(null)
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      if (tab === 'signin') {
        await signInWithEmail(email.trim(), password)
      } else {
        await signUpWithEmail(email.trim(), password)
        setSuccessMsg('Account created! Check your email to confirm, then sign in.')
      }
    } catch (err) {
      setError((err as Error).message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen safeEdges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          {navigation?.canGoBack?.() ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={{ alignSelf: 'flex-start', marginBottom: 24 }}
            >
              <Text variant="small" tone="muted">
                {'‹ Back'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text
              style={{
                fontFamily: theme.fonts.displaySemibold,
                fontSize: 50,
                lineHeight: 60,
                color: theme.colors.textPrimary,
                letterSpacing: -1,
                paddingVertical: 6,
              }}
            >
              Folio
            </Text>
            <Text variant="body" tone="secondary" center style={{ marginTop: 6 }}>
              Your notes, beautifully organized.
            </Text>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => {
                setTab('signin')
                setError(null)
                setSuccessMsg(null)
              }}
              hitSlop={6}
            >
              <Text
                variant="label"
                tone={tab === 'signin' ? 'primary' : 'muted'}
                weight={tab === 'signin' ? 'semibold' : 'regular'}
              >
                Sign in
              </Text>
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: tab === 'signin' ? theme.colors.accent : 'transparent' },
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => {
                setTab('signup')
                setError(null)
                setSuccessMsg(null)
              }}
              hitSlop={6}
            >
              <Text
                variant="label"
                tone={tab === 'signup' ? 'primary' : 'muted'}
                weight={tab === 'signup' ? 'semibold' : 'regular'}
              >
                Sign up
              </Text>
              <View
                style={[
                  styles.tabIndicator,
                  { backgroundColor: tab === 'signup' ? theme.colors.accent : 'transparent' },
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12 }}>
            <Input
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              placeholder="Password"
              secureTextEntry
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
            />
          </View>

          {error ? (
            <Text variant="small" tone="danger" center style={{ marginTop: 14 }}>
              {error}
            </Text>
          ) : null}
          {successMsg ? (
            <Text variant="small" tone="success" center style={{ marginTop: 14 }}>
              {successMsg}
            </Text>
          ) : null}

          <View style={{ height: 20 }} />

          <Button
            label={tab === 'signin' ? 'Sign in' : 'Create account'}
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            fullWidth
          />

          <Text
            variant="micro"
            tone="muted"
            center
            style={{ marginTop: 32, fontFamily: theme.fonts.display, fontStyle: 'italic' }}
          >
            A quiet place for your thoughts.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 36,
  },
  tabs: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 28,
    justifyContent: 'center',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabIndicator: {
    marginTop: 6,
    height: 2,
    width: 28,
    borderRadius: 2,
  },
})
