import type { ReactNode } from 'react'

export interface MobileActionItem {
  id: string
  onClick: () => void
  title: string
  icon: ReactNode
}

interface Props {
  items?: MobileActionItem[]
}

export default function MobileActionBar(props: Props) {
  const { items } = props

  if (!items?.length) {
    return null
  }

  return (
    <div className="mobile-action-bar" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mobile-bar-inner">
        <div className="mobile-action-bar-inner">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              title={item.title}
              aria-label={item.title}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
