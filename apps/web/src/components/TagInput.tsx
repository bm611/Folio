import { useState, useRef, useCallback } from 'react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import Icon from './Icon'

interface TagInputProps {
  tags?: string[]
  onChange: (tags: string[]) => void
}

// Deterministic color assignment from the app's brand palette.
// Each color has a dark-mode and light-mode variant defined via CSS classes.
const TAG_COLOR_VARIANTS: string[] = [
  'tag--rose',      // accent: #d17b88 rose
  'tag--lavender',  // #aba1c4 soft lavender
  'tag--teal',      // #5e9fb8 muted teal
  'tag--mauve',     // #c5bce0 pale mauve
  'tag--sky',       // #7eb5cc sky blue
  'tag--peach',     // #e895a2 blush/peach
]

function getTagColor(label: string): string {
  // xmur3 — excellent avalanche on short strings, no modulo bias
  let h = 1779033703 ^ label.length
  for (let i = 0; i < label.length; i++) {
    h = Math.imul(h ^ label.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h = (h ^ (h >>> 16)) >>> 0
  return TAG_COLOR_VARIANTS[h % TAG_COLOR_VARIANTS.length]!
}

function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '')
    .slice(0, 32)
}

export default function TagInput({ tags = [], onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = useCallback(
    (raw: string) => {
      const tag = normalizeTag(raw)
      if (!tag) return
      if (tags.includes(tag)) {
        setInputValue('')
        return
      }
      onChange([...tags, tag])
      setInputValue('')
    },
    [tags, onChange]
  )

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag))
    },
    [tags, onChange]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]!)
    } else if (e.key === 'Escape') {
      setInputValue('')
      inputRef.current?.blur()
    }
  }

  const handleBlur = () => {
    setFocused(false)
    if (inputValue.trim()) {
      addTag(inputValue)
    }
  }

  return (
    <div className={`tag-input-row${focused ? ' tag-input-row--focused' : ''}`}>
      {tags.map((tag) => {
        const colorClass = getTagColor(tag)
        return (
          <span key={tag} className={`tag-chip ${colorClass}`}>
            <span className="tag-chip__label">{tag}</span>
            <button
              type="button"
              className="tag-chip__remove"
              onClick={() => removeTag(tag)}
              tabIndex={-1}
              aria-label={`Remove tag ${tag}`}
            >
              <Icon icon={Cancel01Icon} size={10} stroke={2.5} />
            </button>
          </span>
        )
      })}

      <input
        ref={inputRef}
        type="text"
        className="tag-input-field"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder={tags.length === 0 ? 'Add tags…' : ''}
        aria-label="Add a tag"
        maxLength={36}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
      />
    </div>
  )
}
