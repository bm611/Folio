// @ts-nocheck
// React Navigation 7 + @types/react 19 has a known JSX type conflict.
// This file is pure navigation config with no business logic — nocheck is safe here.
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { NoteFile } from '@folio/shared'
import HomeScreen from '../screens/HomeScreen'
import EditorScreen from '../screens/EditorScreen'
import AiChatScreen from '../screens/AiChatScreen'
import SettingsScreen from '../screens/SettingsScreen'
import { useTheme } from '../theme'
import { Text } from '../components/ui'

import type { NavigatorScreenParams } from '@react-navigation/native'

export type TabParamList = {
  HomeTab: undefined
  AiTab: { noteId?: string } | undefined
  SettingsTab: undefined
}

export type AppStackParamList = {
  HomeTabs: NavigatorScreenParams<TabParamList> | undefined
  Editor: { noteId: string; seedNote?: NoteFile }
}

const Stack = createNativeStackNavigator<AppStackParamList>()
const Tab = createBottomTabNavigator()

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const theme = useTheme()
  return (
    <Text
      style={{
        fontSize: 22,
        color: focused ? theme.colors.accent : theme.colors.textMuted,
        lineHeight: 26,
      }}
    >
      {label}
    </Text>
  )
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  const theme = useTheme()
  return (
    <Text
      variant="micro"
      style={{
        color: focused ? theme.colors.accent : theme.colors.textMuted,
        fontFamily: theme.fonts.bodyMedium,
        fontSize: 10,
        marginTop: -2,
      }}
    >
      {label}
    </Text>
  )
}

function BottomTabs() {
  const theme = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.bgDeep,
          borderTopColor: theme.colors.borderSubtle,
          borderTopWidth: 0.5,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="◉" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="AiTab"
        component={AiChatScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="✦" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Ask AI" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="⚙" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const theme = useTheme()
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgDeep },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontFamily: theme.fonts.displaySemibold,
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerBackTitle: '',
        contentStyle: { backgroundColor: theme.colors.bgDeep },
      }}
    >
      <Stack.Screen
        name="HomeTabs"
        component={BottomTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Editor"
        component={EditorScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  )
}
