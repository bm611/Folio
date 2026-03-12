export default function MobileActionBar({ items }) {
  if (!items?.length) {
    return null
  }

  return (
    <div className="mobile-action-bar" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
  )
}
