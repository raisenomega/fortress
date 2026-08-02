import type { IconName } from '@domain/shared/icon-name'
import { Icon } from './Icon'

interface EmptyStateProps {
  readonly iconName: IconName
  readonly title: string
  readonly hint: string
  readonly children?: React.ReactNode
}

export function EmptyState({
  iconName,
  title,
  hint,
  children
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
      <Icon name={iconName} size={30} className="text-muted-foreground" />
      <h3 className="text-base text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{hint}</p>
      {children}
    </div>
  )
}
