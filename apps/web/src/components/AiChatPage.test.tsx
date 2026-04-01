import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import AiChatPage from './AiChatPage'
import type { NoteFile } from '../types'
import { streamAiChat } from '../utils/aiChat'

vi.mock('../utils/aiChat', () => ({
  streamAiChat: vi.fn(),
}))

const mockedStreamAiChat = vi.mocked(streamAiChat)

function createNote(overrides: Partial<NoteFile> = {}): NoteFile {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    type: 'file',
    name: overrides.name ?? overrides.title ?? 'Untitled',
    title: overrides.title ?? overrides.name ?? 'Untitled',
    content: overrides.content ?? 'Body',
    tags: overrides.tags ?? [],
    parentId: overrides.parentId ?? null,
    deletedAt: overrides.deletedAt ?? null,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
  }
}

function setCaret(node: Node, offset: number) {
  const selection = window.getSelection()
  const range = document.createRange()
  range.setStart(node, offset)
  range.collapse(true)
  selection?.removeAllRanges()
  selection?.addRange(range)
}

function getComposer(container: HTMLElement) {
  const composer = container.querySelector('[contenteditable="true"]') as HTMLElement | null
  expect(composer).toBeTruthy()
  return composer as HTMLElement
}

function setComposerText(composer: HTMLElement, text: string) {
  composer.textContent = text
  const textNode = composer.firstChild ?? composer
  const offset = textNode.nodeType === Node.TEXT_NODE ? text.length : composer.childNodes.length
  setCaret(textNode, offset)
  fireEvent.input(composer)
}

function appendComposerText(composer: HTMLElement, text: string) {
  const lastChild = composer.lastChild

  if (lastChild?.nodeType === Node.TEXT_NODE) {
    lastChild.textContent = `${lastChild.textContent || ''}${text}`
    setCaret(lastChild, lastChild.textContent?.length ?? 0)
  } else {
    const textNode = document.createTextNode(text)
    composer.appendChild(textNode)
    setCaret(textNode, text.length)
  }

  fireEvent.input(composer)
}

describe('AiChatPage mentions', () => {
  beforeAll(() => {
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = vi.fn()
    }

    if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'innerText')) {
      Object.defineProperty(HTMLElement.prototype, 'innerText', {
        configurable: true,
        get() {
          return this.textContent ?? ''
        },
        set(value: string) {
          this.textContent = value
        },
      })
    }
  })

  beforeEach(() => {
    mockedStreamAiChat.mockReset()
    mockedStreamAiChat.mockImplementation(async (_request, callbacks) => {
      callbacks.onToken('AI reply')
      callbacks.onDone()
    })
  })

  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('opens the mention picker, filters notes, shows an empty state, and inserts a pill with Enter', async () => {
    const notes = [
      createNote({ id: 'alpha', title: 'Alpha note', name: 'alpha-note' }),
      createNote({ id: 'beta', title: 'Beta summary', name: 'beta-summary' }),
      createNote({ id: 'ghost', title: 'Ghost note', name: 'ghost-note', deletedAt: '2026-01-02T00:00:00.000Z' }),
    ]

    const { container } = render(<AiChatPage notes={notes} />)
    const composer = getComposer(container)

    setComposerText(composer, '@zzz')

    await waitFor(() => {
      expect(screen.getByText('No notes found')).toBeTruthy()
    })

    fireEvent.mouseDown(document.body)

    await waitFor(() => {
      expect(container.querySelector('[data-mention-picker]')).toBeNull()
    })

    setComposerText(composer, 'Ask about @alp')

    const picker = await waitFor(() => {
      const nextPicker = container.querySelector('[data-mention-picker]') as HTMLElement | null
      expect(nextPicker).toBeTruthy()
      return nextPicker as HTMLElement
    })

    expect(within(picker).getByText('Alpha note')).toBeTruthy()
    expect(within(picker).queryByText('Beta summary')).toBeNull()
    expect(within(picker).queryByText('Ghost note')).toBeNull()

    fireEvent.keyDown(composer, { key: 'Enter' })

    await waitFor(() => {
      const pill = composer.querySelector('[data-mention-id="alpha"]') as HTMLElement | null
      expect(pill).toBeTruthy()
      expect(pill?.dataset.mentionLabel).toBe('Alpha note')
      expect(pill?.querySelector('svg')).toBeTruthy()
    })

    await waitFor(() => {
      expect(container.querySelector('[data-mention-picker]')).toBeNull()
    })
  })

  it('excludes selected notes from the picker until the pill is removed and re-added', async () => {
    const notes = [
      createNote({ id: 'alpha', title: 'Alpha note', name: 'alpha-note' }),
      createNote({ id: 'beta', title: 'Beta summary', name: 'beta-summary' }),
    ]

    const { container } = render(<AiChatPage notes={notes} />)
    const composer = getComposer(container)

    setComposerText(composer, '@bet')

    const betaButton = await screen.findByText('Beta summary')
    fireEvent.mouseDown(betaButton.closest('button') as HTMLElement)

    await waitFor(() => {
      expect(composer.querySelector('[data-mention-id="beta"]')).toBeTruthy()
    })

    appendComposerText(composer, '@')

    const picker = await waitFor(() => {
      const nextPicker = container.querySelector('[data-mention-picker]') as HTMLElement | null
      expect(nextPicker).toBeTruthy()
      return nextPicker as HTMLElement
    })

    expect(within(picker).queryByText('Beta summary')).toBeNull()
    expect(within(picker).getByText('Alpha note')).toBeTruthy()

    const betaPill = composer.querySelector('[data-mention-id="beta"]') as HTMLElement
    const removeButton = within(betaPill).getByRole('button', { name: 'Remove Beta summary mention' })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(composer.querySelector('[data-mention-id="beta"]')).toBeNull()
    })

    setComposerText(composer, '@bet')

    const pickerAfterRemoval = await waitFor(() => {
      const nextPicker = container.querySelector('[data-mention-picker]') as HTMLElement | null
      expect(nextPicker).toBeTruthy()
      return nextPicker as HTMLElement
    })

    expect(within(pickerAfterRemoval).getByText('Beta summary')).toBeTruthy()
  })

  it('serializes mention pills cleanly into the AI request and clears composer state after send', async () => {
    const notes = [
      createNote({ id: 'alpha', title: 'Alpha note', name: 'alpha-note', content: 'Important context' }),
    ]

    const { container } = render(<AiChatPage notes={notes} />)
    const composer = getComposer(container)

    setComposerText(composer, 'Summarize @alp')

    const alphaButton = await screen.findByText('Alpha note')
    fireEvent.mouseDown(alphaButton.closest('button') as HTMLElement)

    await waitFor(() => {
      expect(composer.querySelector('[data-mention-id="alpha"]')).toBeTruthy()
    })

    appendComposerText(composer, 'please')

    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => {
      expect(mockedStreamAiChat).toHaveBeenCalledTimes(1)
    })

    expect(mockedStreamAiChat.mock.calls[0]?.[0]).toEqual({
      question: 'Summarize @Alpha note please',
      noteContents: [
        {
          title: 'Alpha note',
          content: 'Important context',
        },
      ],
    })

    await waitFor(() => {
      expect(composer.querySelector('[data-mention-id]')).toBeNull()
      expect(composer.textContent).toBe('')
    })

    expect(screen.getByText('Summarize @Alpha note please')).toBeTruthy()
  })

  it('keeps the send button disabled for empty input and enables it once the composer has text', async () => {
    const { container } = render(<AiChatPage notes={[]} />)
    const composer = getComposer(container)
    const sendButton = screen.getByRole('button', { name: 'Send message' }) as HTMLButtonElement

    expect(sendButton.disabled).toBe(true)

    setComposerText(composer, 'Draft a recap')

    await waitFor(() => {
      expect(sendButton.disabled).toBe(false)
    })
  })

  it('opens the note picker from the plus button and inserts a mention at the current caret', async () => {
    const notes = [
      createNote({ id: 'alpha', title: 'Alpha note', name: 'alpha-note' }),
      createNote({ id: 'beta', title: 'Beta summary', name: 'beta-summary' }),
    ]

    const { container } = render(<AiChatPage notes={notes} />)
    const composer = getComposer(container)

    setComposerText(composer, 'Review this')

    fireEvent.click(screen.getByRole('button', { name: 'Insert note mention' }))

    const betaButton = await screen.findByText('Beta summary')
    fireEvent.mouseDown(betaButton.closest('button') as HTMLElement)

    await waitFor(() => {
      const pill = composer.querySelector('[data-mention-id="beta"]') as HTMLElement | null
      expect(pill).toBeTruthy()
    })
  })

  it('loads a suggested prompt into the composer when clicked', async () => {
    const { container } = render(<AiChatPage notes={[]} />)
    const composer = getComposer(container)

    fireEvent.click(screen.getByRole('button', { name: 'Find notes about a topic' }))

    await waitFor(() => {
      expect(composer.textContent).toBe('Find notes about a topic')
    })
  })

  it('renders the animated empty-state illustration before a conversation starts', () => {
    render(<AiChatPage notes={[]} />)

    expect(screen.getByTestId('ai-chat-empty-illustration')).toBeTruthy()
  })
})
