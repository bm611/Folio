import { act } from 'react'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import LiveMarkdownEditor from './LiveMarkdownEditor'

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  if (!Element.prototype.getBoundingClientRect) {
    Element.prototype.getBoundingClientRect = function getBoundingClientRect() {
      return new DOMRect(0, 0, 0, 0)
    }
  }

  if (!HTMLElement.prototype.getClientRects) {
    HTMLElement.prototype.getClientRects = function getClientRects() {
      return [new DOMRect(0, 0, 0, 0)]
    }
  }

  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = function getClientRects() {
      return [new DOMRect(0, 0, 0, 0)]
    }
  }
})

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

describe('LiveMarkdownEditor', () => {
  it('exposes editor commands through the registered API', async () => {
    const handleChange = vi.fn()
    let api = null
    const { container } = render(
      <LiveMarkdownEditor
        value="Hello world"
        onChange={handleChange}
        onRegisterEditorApi={(nextApi) => {
          api = nextApi
        }}
      />
    )

    await waitFor(() => expect(api).toBeTruthy())

    act(() => {
      api.focus()
      api.runCommand('heading-1')
    })

    await waitFor(() => {
      expect(container.querySelector('h1')?.textContent).toContain('Hello world')
    })

    await waitFor(() => {
      const payload = handleChange.mock.calls.at(-1)?.[0]
      expect(payload.editorVersion).toBe(2)
      expect(payload.contentDoc?.type).toBe('doc')
      expect(payload.content).toContain('# Hello world')
    })
  })

  it('parses pasted markdown into structured nodes', async () => {
    const handleChange = vi.fn()
    const { container } = render(
      <LiveMarkdownEditor
        value=""
        onChange={handleChange}
        onRegisterEditorApi={() => {}}
      />
    )

    const surface = container.querySelector('.ProseMirror')
    expect(surface).toBeTruthy()

    surface.focus()

    fireEvent.paste(surface, {
      clipboardData: {
        getData(type) {
          if (type === 'text/plain') {
            return '# Pasted heading\n\n- [x] Finished task'
          }

          return ''
        },
      },
    })

    await waitFor(() => {
      expect(container.querySelector('h1')?.textContent).toContain('Pasted heading')
      expect(container.querySelector('ul[data-type="taskList"] li[data-checked="true"]')).toBeTruthy()
    })

    await waitFor(() => {
      const payload = handleChange.mock.calls.at(-1)?.[0]
      expect(payload.content).toContain('# Pasted heading')
      expect(payload.content).toContain('- [x] Finished task')
    })
  })
})
