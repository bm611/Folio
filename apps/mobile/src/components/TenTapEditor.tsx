import { useEffect, useMemo, useRef } from 'react'
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from 'react-native'
import {
  RichText,
  Toolbar,
  useEditorBridge,
  useEditorContent,
  TenTapStartKit,
  CoreBridge,
  PlaceholderBridge,
  DEFAULT_TOOLBAR_ITEMS,
} from '@10play/tentap-editor'
import { useTheme, type Theme } from '../theme'

function buildEditorCss(theme: Theme) {
  const c = theme.colors
  return `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: ${c.bgPrimary};
    color: ${c.textPrimary};
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
  }
  .ProseMirror {
    outline: none;
    padding: 16px 20px 60px;
    caret-color: ${c.accent};
    min-height: 100vh;
  }
  .ProseMirror p { margin: 0 0 14px; }
  .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    letter-spacing: -0.3px;
    margin: 24px 0 10px;
    line-height: 1.25;
  }
  .ProseMirror h1 { font-size: 30px; color: ${c.colorH1}; }
  .ProseMirror h2 { font-size: 24px; color: ${c.colorH2}; }
  .ProseMirror h3 { font-size: 19px; color: ${c.colorH3}; }
  .ProseMirror ul, .ProseMirror ol {
    padding-left: 24px;
    margin: 8px 0 14px;
  }
  .ProseMirror li { margin: 4px 0; }
  .ProseMirror li > p { margin: 0; }
  .ProseMirror blockquote {
    border-left: 3px solid ${c.accent};
    margin: 16px 0;
    padding: 4px 0 4px 16px;
    color: ${c.textSecondary};
    font-style: italic;
    font-family: 'Fraunces', Georgia, serif;
  }
  .ProseMirror pre {
    background: ${c.bgSurface};
    padding: 14px 16px;
    border-radius: 12px;
    overflow-x: auto;
    margin: 14px 0;
    border: 1px solid ${c.borderSubtle};
  }
  .ProseMirror pre code {
    background: transparent;
    padding: 0;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: ${c.textPrimary};
  }
  .ProseMirror code {
    background: ${c.bgSurface};
    padding: 2px 6px;
    border-radius: 6px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13.5px;
    color: ${c.accent};
    border: 1px solid ${c.borderSubtle};
  }
  .ProseMirror a {
    color: ${c.accent};
    text-decoration: none;
    border-bottom: 1px solid ${c.accentMuted};
  }
  .ProseMirror hr {
    border: none;
    border-top: 1px solid ${c.borderSubtle};
    margin: 24px 0;
  }
  .ProseMirror table {
    border-collapse: collapse;
    width: 100%;
    margin: 14px 0;
    font-size: 14px;
  }
  .ProseMirror th, .ProseMirror td {
    border: 1px solid ${c.borderSubtle};
    padding: 8px 10px;
    text-align: left;
  }
  .ProseMirror th {
    background: ${c.bgSurface};
    font-weight: 600;
    color: ${c.textPrimary};
  }
  .ProseMirror tr:nth-child(even) td {
    background: ${c.bgSurface};
  }
  ::selection { background: ${c.accentMuted}; color: ${c.textPrimary}; }
  ul[data-type="taskList"] {
    list-style: none;
    padding-left: 0;
  }
  ul[data-type="taskList"] li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 2px; }
  ul[data-type="taskList"] li > div { flex: 1; }
  ul[data-type="taskList"] input[type="checkbox"] {
    accent-color: ${c.accent};
    width: 16px; height: 16px;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: ${c.textMuted};
    pointer-events: none;
    height: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
  }
`
}

interface TenTapEditorProps {
  initialContent: string
  initialContentDoc?: Record<string, unknown>
  onChange: (html: string, json: object) => void
  placeholder?: string
  style?: ViewStyle
}

export default function TenTapEditor({
  initialContent,
  initialContentDoc,
  onChange,
  placeholder = 'Start writing…',
  style,
}: TenTapEditorProps) {
  const theme = useTheme()
  const css = useMemo(() => buildEditorCss(theme), [theme])

  const startContent = initialContentDoc || initialContent || '<p></p>'

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: startContent,
    bridgeExtensions: [
      ...TenTapStartKit,
      PlaceholderBridge.configureExtension({ placeholder }),
      CoreBridge.configureCSS(css),
    ],
  })

  const htmlContent = useEditorContent(editor, { type: 'html' })
  const jsonContent = useEditorContent(editor, { type: 'json' })
  const lastEmittedRef = useRef<string | null>(null)

  useEffect(() => {
    if (htmlContent && jsonContent && htmlContent !== lastEmittedRef.current) {
      lastEmittedRef.current = htmlContent
      onChange(htmlContent, jsonContent)
    }
  }, [htmlContent, jsonContent, onChange])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgPrimary }, style]}>
      <RichText editor={editor} style={styles.richText} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.toolbarWrapper}
      >
        <Toolbar editor={editor} items={DEFAULT_TOOLBAR_ITEMS} />
      </KeyboardAvoidingView>
    </View>
  )
}

export { useEditorBridge }

const styles = StyleSheet.create({
  container: { flex: 1 },
  richText: { flex: 1 },
  toolbarWrapper: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
})
