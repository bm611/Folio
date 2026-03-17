import { useState } from 'react'
import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { IconCopy, IconCheck, IconTrash, IconChevronDown } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'

const LANGUAGES = [
  { id: 'auto', label: 'Auto' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'bash', label: 'Bash' },
  { id: 'sql', label: 'SQL' },
  { id: 'html', label: 'HTML/CSS' },
]

export default function CodeBlockView({ node, updateAttributes, deleteNode }) {
  const [copied, setCopied] = useState(false)
  const language = node.attrs.language || 'auto'

  const handleCopy = () => {
    const code = node.textContent
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleLanguageChange = (event) => {
    updateAttributes({ language: event.target.value })
  }

  return (
    <NodeViewWrapper className="aura-code-block-wrapper group">
      <div className="aura-code-block-header" contentEditable={false}>
        <div className="aura-code-block-lang">
          <select 
            value={language} 
            onChange={handleLanguageChange}
            className="aura-code-block-select"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.label}
              </option>
            ))}
          </select>
          <IconChevronDown size={14} className="aura-code-block-select-icon" />
        </div>

        <div className="aura-code-block-actions">
          <button
            type="button"
            className={`aura-code-block-copy ${copied ? 'is-copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          
          <button
            type="button"
            className="aura-code-block-delete"
            onClick={deleteNode}
            title="Delete block"
          >
            <IconTrash size={14} />
          </button>
        </div>
      </div>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}
