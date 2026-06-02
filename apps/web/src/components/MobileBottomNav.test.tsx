import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'

import MobileBottomNav from './MobileBottomNav'

afterEach(cleanup)

describe('MobileBottomNav', () => {
  const defaultProps = {
    activeView: 'notes' as const,
    onViewChange: vi.fn(),
    onToggleSidebar: vi.fn(),
    onNewNote: vi.fn(),
  }

  it('renders correctly with notes active', () => {
    const { getByLabelText } = render(<MobileBottomNav {...defaultProps} />)

    expect(getByLabelText('View notes')).toBeDefined()
    expect(getByLabelText('Ask AI Assistant')).toBeDefined()
    expect(getByLabelText('Create new note')).toBeDefined()
    expect(getByLabelText('Open sidebar menu')).toBeDefined()
  })

  it('triggers onViewChange when notes or chat is clicked', () => {
    const onViewChange = vi.fn()
    const { getByLabelText } = render(
      <MobileBottomNav {...defaultProps} onViewChange={onViewChange} />
    )

    fireEvent.click(getByLabelText('Ask AI Assistant'))
    expect(onViewChange).toHaveBeenCalledWith('chat')
  })

  it('triggers onToggleSidebar when menu is clicked', () => {
    const onToggleSidebar = vi.fn()
    const { getByLabelText } = render(
      <MobileBottomNav {...defaultProps} onToggleSidebar={onToggleSidebar} />
    )

    fireEvent.click(getByLabelText('Open sidebar menu'))
    expect(onToggleSidebar).toHaveBeenCalled()
  })

  it('triggers onNewNote when FAB is clicked', () => {
    const onNewNote = vi.fn()
    const { getByLabelText } = render(
      <MobileBottomNav {...defaultProps} onNewNote={onNewNote} />
    )

    fireEvent.click(getByLabelText('Create new note'))
    expect(onNewNote).toHaveBeenCalled()
  })
})
