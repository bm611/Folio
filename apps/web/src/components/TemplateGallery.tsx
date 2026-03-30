import { useEffect, useCallback } from 'react'
import {
  Cancel01Icon,
  CalendarIcon,
  CheckmarkSquare01Icon,
  File01Icon,
  FolderOpenIcon,
  MeetingRoomIcon,
  StickyNoteIcon,
} from '@hugeicons/core-free-icons'
import Icon from './Icon'
import type { IconSvgElement } from '@hugeicons/react'
import { TEMPLATES, type Template } from '../config/templates'

const TEMPLATE_ICON_MAP: Record<string, IconSvgElement> = {
  Meeting: MeetingRoomIcon,
  Briefcase: FolderOpenIcon,
  Checkbox: CheckmarkSquare01Icon,
  Folder: FolderOpenIcon,
  Calendar: CalendarIcon,
  File: File01Icon,
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: Template
  onSelect: (template: Template) => void
}) {
  const icon = TEMPLATE_ICON_MAP[template.icon] || File01Icon

  return (
    <button
      type="button"
      className="tg-card"
      onClick={() => onSelect(template)}
    >
      <span className="tg-card-icon">
        <Icon icon={icon} size={28} strokeWidth={1.5} />
      </span>
      <span className="tg-card-name">{template.name}</span>
      <span className="tg-card-desc">{template.description}</span>
    </button>
  )
}

interface TemplateGalleryProps {
  open: boolean
  onClose: () => void
  onSelectTemplate: (template: Template) => void
}

export default function TemplateGallery({
  open,
  onClose,
  onSelectTemplate,
}: TemplateGalleryProps) {
  const handleSelect = useCallback(
    (template: Template) => {
      onSelectTemplate(template)
      onClose()
    },
    [onSelectTemplate, onClose],
  )

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Template gallery"
        className="fixed left-1/2 top-1/2 z-[101] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-2xl"
      >
        <div className="tg-modal">
          <div className="tg-modal-header">
            <div className="tg-modal-title-row">
              <Icon icon={StickyNoteIcon} size={22} strokeWidth={1.5} className="tg-modal-title-icon" />
              <h2 className="tg-modal-title">Templates</h2>
            </div>
            <button type="button" className="tg-modal-close" onClick={onClose} aria-label="Close">
              <Icon icon={Cancel01Icon} size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="tg-modal-body">
            <p className="tg-modal-subtitle">Choose a template to get started</p>
            <div className="tg-grid">
              {TEMPLATES.map((template) => (
                <TemplateCard key={template.id} template={template} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
