import type { IconName } from '@domain/shared/icon-name'
import { ICON_REGISTRY } from './icon-registry'

interface IconProps {
  readonly name: IconName
  readonly size?: number
  readonly className?: string
}

/** Los SVG de Lucide heredan currentColor, asi que respetan el tema solos. */
export function Icon({ name, size = 14, className }: IconProps): React.JSX.Element {
  const Glyph = ICON_REGISTRY[name]
  return <Glyph size={size} className={className} strokeWidth={2} aria-hidden />
}
