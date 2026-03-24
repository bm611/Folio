import { useState } from 'react'
import { InputRule, mergeAttributes, Node } from '@tiptap/core'
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  AlertCircleIcon,
  AlertDiamondIcon,
  Alert02Icon,
  BugIcon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  ClipboardIcon,
  File01Icon,
  FireIcon,
  HelpCircleIcon,
  InformationCircleIcon,
  LeftToRightListBulletIcon,
  MessageCircleReplyIcon,
  PencilEdit01Icon,
  Delete01Icon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import Icon from '../../components/Icon'

const CALLOUT_INPUT_PATTERN = /^> \[!([A-Za-z-]+)\]([+-])?\s*(.*)$/
const CALLOUT_KINDS = ['note', 'tip', 'warning', 'caution', 'important']

const CALLOUT_ICONS: Record<string, IconSvgElement> = {
  abstract: File01Icon,
  bug: BugIcon,
  caution: Alert02Icon,
  danger: AlertDiamondIcon,
  example: LeftToRightListBulletIcon,
  failure: CancelCircleIcon,
  important: AlertCircleIcon,
  info: InformationCircleIcon,
  note: PencilEdit01Icon,
  question: HelpCircleIcon,
  quote: MessageCircleReplyIcon,
  success: CheckmarkCircle01Icon,
  tip: FireIcon,
  todo: ClipboardIcon,
  warning: Alert02Icon,
}

function getDefaultTitle(calloutKind: string = 'note'): string {
  return `${calloutKind.charAt(0).toUpperCase()}${calloutKind.slice(1)}`
}

function CalloutView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [collapsed, setCollapsed] = useState(Boolean(node.attrs.defaultCollapsed))
  const calloutKind = (node.attrs.calloutKind as string) || 'note'
  const iconData = CALLOUT_ICONS[calloutKind] ?? CALLOUT_ICONS.note!

  const handleToggleKind = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const currentIndex = CALLOUT_KINDS.indexOf(calloutKind)
    const nextIndex = (currentIndex + 1) % CALLOUT_KINDS.length
    const nextKind = CALLOUT_KINDS[nextIndex]!
    updateAttributes({
      calloutKind: nextKind,
      title: node.attrs.title === getDefaultTitle(calloutKind) ? getDefaultTitle(nextKind) : node.attrs.title,
    })
  }

  return (
    <NodeViewWrapper
      className={`aura-callout aura-callout-${calloutKind} ${selected ? 'is-selected' : ''}`}
      data-callout-kind={calloutKind}
    >
      <div className="aura-callout-header" contentEditable={false}>
        <button
          type="button"
          className="aura-callout-icon-btn"
          onClick={handleToggleKind}
          title="Change type"
        >
          <Icon icon={iconData} size={16} stroke={1.8} />
        </button>
        <input
          className="aura-callout-title"
          value={(node.attrs.title as string) || getDefaultTitle(calloutKind)}
          onChange={(event) => updateAttributes({ title: event.target.value })}
          onMouseDown={(event) => event.stopPropagation()}
          aria-label="Callout title"
        />
        <div className="aura-callout-actions">
          {node.attrs.foldable ? (
            <button
              type="button"
              className={`aura-callout-toggle ${collapsed ? 'is-collapsed' : ''}`}
              onClick={() => setCollapsed((current) => !current)}
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              aria-label={collapsed ? 'Expand callout' : 'Collapse callout'}
            >
              <Icon icon={ArrowDown01Icon} size={14} stroke={1.7} />
            </button>
          ) : null}
          <button
            type="button"
            className="aura-callout-delete"
            onClick={deleteNode}
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            title="Delete callout"
          >
            <Icon icon={Delete01Icon} size={14} stroke={1.7} />
          </button>
        </div>
      </div>
      <NodeViewContent className={`aura-callout-body ${collapsed ? 'is-collapsed' : ''}`} />
    </NodeViewWrapper>
  )
}

export const CalloutNode = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  isolating: true,

  addAttributes() {
    return {
      calloutKind: {
        default: 'note',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-callout-kind') || 'note',
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-callout-kind': attributes.calloutKind,
        }),
      },
      title: {
        default: 'Note',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-callout-title') || 'Note',
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-callout-title': attributes.title,
        }),
      },
      foldable: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-callout-foldable') === 'true',
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-callout-foldable': attributes.foldable ? 'true' : 'false',
        }),
      },
      defaultCollapsed: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-callout-collapsed') === 'true',
        renderHTML: (attributes: Record<string, unknown>) => ({
          'data-callout-collapsed': attributes.defaultCollapsed ? 'true' : 'false',
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },

  // @ts-expect-error — custom command not in RawCommands
  addCommands() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const extension = this
    return {
      insertCallout:
        (attrs: Record<string, unknown> = {}) =>
        ({ commands }: { commands: any }) =>
          commands.insertContent({
            type: extension.name,
            attrs: {
              calloutKind: attrs.calloutKind || 'note',
              title: attrs.title || getDefaultTitle((attrs.calloutKind as string) || 'note'),
              foldable: Boolean(attrs.foldable),
              defaultCollapsed: Boolean(attrs.defaultCollapsed),
            },
            content: [{ type: 'paragraph' }],
          }),
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: CALLOUT_INPUT_PATTERN,
        handler: ({ chain, range, match }) => {
          const calloutKind = (match[1] || 'note').toLowerCase()
          const foldMarker = match[2] || ''
          const title = match[3]?.trim() || getDefaultTitle(calloutKind)

          chain()
            .deleteRange(range)
            .insertContent({
              type: this.name,
              attrs: {
                calloutKind,
                title,
                foldable: foldMarker === '-' || foldMarker === '+',
                defaultCollapsed: foldMarker === '-',
              },
              content: [{ type: 'paragraph' }],
            })
            .run()
        },
      }),
    ]
  },
})
