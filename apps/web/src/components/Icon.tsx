import { HugeiconsIcon } from '@hugeicons/react'
import type { IconSvgElement } from '@hugeicons/react'

interface IconProps {
  icon: IconSvgElement
  size?: number
  strokeWidth?: number
  stroke?: number
  color?: string
  className?: string
  [key: string]: unknown
}

export default function Icon({ icon, size = 24, strokeWidth, stroke, color = 'currentColor', className = '', ...rest }: IconProps) {
  const resolvedStrokeWidth = strokeWidth ?? stroke
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={resolvedStrokeWidth}
      color={color}
      className={className}
      {...rest}
    />
  )
}
