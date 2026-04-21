import { useEffect, useRef } from 'react'
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

const DARK_EDITOR_CSS = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #0f0f0f;
    color: #e8e8e8;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    line-height: 1.625;
    -webkit-font-smoothing: antialiased;
  }
  .ProseMirror {
    outline: none;
    padding: 0 16px 40px;
    caret-color: #e8e8e8;
    min-height: 100vh;
  }
  .ProseMirror p { margin: 0 0 12px; }
  .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
    margin: 20px 0 10px;
    font-weight: 600;
    line-height: 1.3;
  }
  .ProseMirror h1 { font-size: 26px; }
  .ProseMirror h2 { font-size: 22px; }
  .ProseMirror h3 { font-size: 18px; }
  .ProseMirror ul, .ProseMirror ol {
    padding-left: 24px;
    margin: 8px 0;
  }
  .ProseMirror li { margin: 4px 0; }
  .ProseMirror li > p { margin: 0; }
  .ProseMirror blockquote {
    border-left: 3px solid #333;
    margin: 12px 0;
    padding-left: 14px;
    color: #aaa;
    font-style: italic;
  }
  .ProseMirror pre {
    background: #1a1a1a;
    padding: 14px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 12px 0;
  }
  .ProseMirror pre code {
    background: transparent;
    padding: 0;
    font-size: 14px;
    color: #e8e8e8;
  }
  .ProseMirror code {
    background: #1a1a1a;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Menlo', monospace;
    font-size: 14px;
    color: #e07a8a;
  }
  .ProseMirror a {
    color: #4a9eff;
    text-decoration: none;
  }
  .ProseMirror hr {
    border: none;
    border-top: 1px solid #2a2a2a;
    margin: 20px 0;
  }
  .ProseMirror table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 14px;
  }
  .ProseMirror th, .ProseMirror td {
    border: 1px solid #2a2a2a;
    padding: 8px 10px;
    text-align: left;
  }
  .ProseMirror th {
    background: #1a1a1a;
    font-weight: 600;
  }
  .ProseMirror tr:nth-child(even) {
    background: #141414;
  }
  ::selection { background: #264f78; color: #fff; }
  ul[data-type="taskList"] {
    list-style: none;
    padding-left: 0;
  }
  ul[data-type="taskList"] li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  ul[data-type="taskList"] li > label {
    flex-shrink: 0;
    margin-top: 2px;
  }
  ul[data-type="taskList"] li > div { flex: 1; }
  ul[data-type="taskList"] input[type="checkbox"] {
    accent-color: #e07a8a;
    width: 16px;
    height: 16px;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    color: #444;
    pointer-events: none;
    height: 0;
  }
`

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
  // Prefer contentDoc (Tiptap JSON) when available, fall back to HTML/text
  const startContent = initialContentDoc ?? initialContent ?? '<p></p>'

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: startContent,
    bridgeExtensions: [
      ...TenTapStartKit,
      PlaceholderBridge.configureExtension({ placeholder }),
      CoreBridge.configureCSS(DARK_EDITOR_CSS),
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
    <View style={[styles.container, style]}>
      <RichText editor={editor} style={styles.richText} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.toolbarWrapper}
      >
        <Toolbar
          editor={editor}
          items={DEFAULT_TOOLBAR_ITEMS}
        />
      </KeyboardAvoidingView>
    </View>
  )
}

export { useEditorBridge }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  richText: {
    flex: 1,
  },
  toolbarWrapper: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
})
