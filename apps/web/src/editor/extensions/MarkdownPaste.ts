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
            const html = event.clipboardData?.getData('text/html') || ''
            const text = event.clipboardData?.getData('text/plain') || ''

            if (!text) {
              return false
            }

            // When both HTML and plain text are on the clipboard, prefer
            // markdown conversion if the plain text looks like markdown.
            // Clipboards often include a trivial HTML wrapper (p/div/span)
            // even for plain text — the user intent is to paste markdown.
            // Only skip our converter when the HTML itself already carries
            // rendered formatting AND the plain text has no raw markdown.
            if (!looksLikeMarkdown(text)) {
              return false
            }

            // If HTML is present AND already contains the rendered
            // formatting, the source app did the work — use default paste.
            // But if the markdown characters are still raw in the plain
            // text, our converter will do a better job.
            if (html.length > 0) {
              const hasFormattedHtml = /<(strong|em|b|i|a|ul|ol|li|h[1-6]|table|blockquote|img)\b/i.test(html)
              // Check if the plain text still has raw markdown syntax —
              // if so, the HTML didn't actually render it
              const hasRawMarkdown = /(\*\*|__|^#{1,6}\s|^[-*+]\s|^\d+\.\s|^>)/m.test(text)
              if (hasFormattedHtml && !hasRawMarkdown) {
                return false
              }
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
