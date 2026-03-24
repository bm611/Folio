import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { getEditorCommands } from '../../utils/editorCommands'
import { runFolioEditorCommand } from '../core/editorCommands'

function createMenu(): HTMLDivElement {
  const element = document.createElement('div')
  element.className = 'aura-slash-menu'
  document.body.appendChild(element)
  return element
}

interface SuggestionProps {
  items: { id: string; trigger: string; title: string }[]
  command: (item: { id: string }) => void
  clientRect?: () => DOMRect | null
}

function renderItems(element: HTMLDivElement, props: SuggestionProps, selectedIndex: number): void {
  element.innerHTML = ''

  props.items.forEach((item, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `aura-slash-item ${index === selectedIndex ? 'is-active' : ''}`
    button.innerHTML = `<span class="aura-slash-trigger">/${item.trigger}</span><span class="aura-slash-title">${item.title}</span>`
    button.addEventListener('mousedown', (event) => {
      event.preventDefault()
      props.command(item)
    })
    element.appendChild(button)
  })
}

function positionMenu(element: HTMLDivElement, props: SuggestionProps): void {
  const rect = props.clientRect?.()
  if (!rect) {
    return
  }

  element.style.left = `${rect.left + window.scrollX}px`
  element.style.top = `${rect.bottom + window.scrollY + 10}px`
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        items: ({ query }: { query: string }) => getEditorCommands(query).slice(0, 12),
        command: ({ editor, range, props }: { editor: unknown; range: { from: number; to: number }; props: { id: string } }) => runFolioEditorCommand(editor as import('@tiptap/react').Editor, props.id, { range }),
        allow: ({ state }: { state: import('@tiptap/pm/state').EditorState }) => state.selection.$from.parent.type.name === 'paragraph',
        render: () => {
          let element: HTMLDivElement | null = null
          let selectedIndex = 0
          let currentProps: SuggestionProps | null = null

          const update = (props: SuggestionProps) => {
            currentProps = props
            selectedIndex = Math.min(selectedIndex, Math.max(props.items.length - 1, 0))

            if (!element) {
              element = createMenu()
            }

            renderItems(element, props, selectedIndex)
            positionMenu(element, props)
          }

          const destroy = () => {
            if (element) {
              element.remove()
            }

            element = null
            currentProps = null
            selectedIndex = 0
          }

          return {
            onStart: update,
            onUpdate: update,
            onKeyDown: ({ event }: { event: KeyboardEvent }) => {
              if (!currentProps) {
                return false
              }

              if (event.key === 'ArrowDown') {
                selectedIndex = Math.min(selectedIndex + 1, currentProps.items.length - 1)
                renderItems(element!, currentProps, selectedIndex)
                return true
              }

              if (event.key === 'ArrowUp') {
                selectedIndex = Math.max(selectedIndex - 1, 0)
                renderItems(element!, currentProps, selectedIndex)
                return true
              }

              if (event.key === 'Enter') {
                currentProps.command(currentProps.items[selectedIndex]!)
                return true
              }

              if (event.key === 'Escape') {
                destroy()
                return false
              }

              return false
            },
            onExit: destroy,
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })]
  },
})
