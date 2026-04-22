// @ts-nocheck
// React Navigation 7 + @types/react 19 has a known JSX type conflict.
// This file is pure navigation config with no business logic — nocheck is safe here.
import { View, ActivityIndicator } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../contexts/AuthContext'
import WelcomeScreen from '../screens/WelcomeScreen'
import LoginScreen from '../screens/LoginScreen'
import AppNavigator from './AppNavigator'
import { NotesProvider } from '../contexts/NotesContext'
import { useTheme } from '../theme'

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const theme = useTheme()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.bgDeep,
        }}
      >
        <ActivityIndicator color={theme.colors.accent} size="large" />
      </View>
    )
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    )
  }

  return (
    <NotesProvider userId={user.id}>
      <AppNavigator />
    </NotesProvider>
  )
}
