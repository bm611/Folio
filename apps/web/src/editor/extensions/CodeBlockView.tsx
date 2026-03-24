import { useState, useCallback, useRef, useEffect } from 'react'

import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import {
  Copy01Icon,
  Tick01Icon,
  Delete01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons'

import Icon from '../../components/Icon'

const POPULAR_LANGUAGES = [
  { value: '', label: 'Plain text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'dart', label: 'Dart' },
  { value: 'scala', label: 'Scala' },
  { value: 'r', label: 'R' },
  { value: 'lua', label: 'Lua' },
  { value: 'perl', label: 'Perl' },
  { value: 'elixir', label: 'Elixir' },
  { value: 'clojure', label: 'Clojure' },
  { value: 'haskell', label: 'Haskell' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'scss', label: 'SCSS' },
  { value: 'less', label: 'Less' },
  { value: 'diff', label: 'Diff' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'makefile', label: 'Makefile' },
  { value: 'ini', label: 'INI' },
]

function getLanguageLabel(value: string): string {
  const found = POPULAR_LANGUAGES.find((lang) => lang.value === value)
  return found ? found.label : value || 'Plain text'
}

export default function CodeBlockView({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const language = (node.attrs.language as string) || ''

  const handleCopy = useCallback(() => {
    const text = node.textContent
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [node])

  const handleLanguageChange = useCallback(
    (value: string) => {
      updateAttributes({ language: value })
      setDropdownOpen(false)
      setSearch('')
    },
    [updateAttributes]
  )

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [dropdownOpen])

  const filteredLanguages = search
    ? POPULAR_LANGUAGES.filter(
        (lang) =>
          lang.label.toLowerCase().includes(search.toLowerCase()) ||
          lang.value.toLowerCase().includes(search.toLowerCase())
      )
    : POPULAR_LANGUAGES

  return (
    <NodeViewWrapper className="aura-codeblock-wrapper" data-language={language}>
      {/* ── Toolbar ── */}
      <div className="aura-codeblock-toolbar" contentEditable={false}>
        {/* Language selector */}
        <div className="aura-codeblock-lang-select" ref={dropdownRef}>
          <button
            type="button"
            className="aura-codeblock-lang-btn"
            onClick={() => setDropdownOpen((prev) => !prev)}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            <span className="aura-codeblock-lang-label">
              {getLanguageLabel(language)}
            </span>
            <Icon
              icon={ArrowDown01Icon}
              size={12}
              stroke={1.8}
              className={`aura-codeblock-chevron ${dropdownOpen ? 'is-open' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="aura-codeblock-dropdown">
              <div className="aura-codeblock-dropdown-search">
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search languages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setDropdownOpen(false)
                      setSearch('')
                    }
                    if (e.key === 'Enter' && filteredLanguages.length > 0) {
                      handleLanguageChange(filteredLanguages[0]!.value)
                    }
                  }}
                  className="aura-codeblock-search-input"
                />
              </div>
              <div className="aura-codeblock-dropdown-list">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    className={`aura-codeblock-dropdown-item ${
                      language === lang.value ? 'is-active' : ''
                    }`}
                    onClick={() => handleLanguageChange(lang.value)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
                {filteredLanguages.length === 0 && (
                  <div className="aura-codeblock-dropdown-empty">
                    No languages found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="aura-codeblock-actions">
          <button
            type="button"
            className={`aura-codeblock-action-btn ${copied ? 'is-copied' : ''}`}
            onClick={handleCopy}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            title={copied ? 'Copied!' : 'Copy code'}
            aria-label={copied ? 'Copied!' : 'Copy code'}
          >
            <Icon
              icon={copied ? Tick01Icon : Copy01Icon}
              size={14}
              stroke={1.8}
            />
          </button>
          <button
            type="button"
            className="aura-codeblock-action-btn aura-codeblock-delete-btn"
            onClick={deleteNode}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            title="Delete code block"
            aria-label="Delete code block"
          >
            <Icon icon={Delete01Icon} size={14} stroke={1.8} />
          </button>
        </div>
      </div>

      {/* ── Code content ── */}
      <pre>
        {/* @ts-expect-error -- NodeViewContent "as" prop accepts any HTML tag but types are restrictive */}
        <NodeViewContent as="code" className={language ? `language-${language}` : ''} />
      </pre>
    </NodeViewWrapper>
  )
}
