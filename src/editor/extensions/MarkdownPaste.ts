import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import { looksLikeMarkdown, markdownToDoc } from '../markdown/markdownConversion'

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (_view, event) => {
            const html = event.clipboardData?.getData('text/html')
            const text = event.clipboardData?.getData('text/plain') || ''

            if (!text) {
              return false
            }

            if (html || !looksLikeMarkdown(text)) {
              return false
            }

            event.preventDefault()

            const doc = markdownToDoc(text, this.editor.extensionManager.extensions)
            this.editor.chain().focus(undefined, { scrollIntoView: false }).insertContent(doc.content || []).run()
            return true
          },
        },
      }),
    ]
  },
})
