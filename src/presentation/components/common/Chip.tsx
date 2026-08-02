import type { IconName } from '@domain/shared/icon-name'
import { Icon } from './Icon'

export type ChipTone = 'agent' | 'project' | 'mode'

const TONE_CLASS: Record<ChipTone, string> = {
  agent: 'border-primary/40 bg-primary/10 text-primary',
  project: 'border-border bg-secondary text-muted-foreground',
  mode: 'border-border bg-muted/50 text-muted-foreground'
}

interface ChipProps {
  readonly tone: ChipTone
  readonly iconName?: IconName
  readonly label: string
  readonly title?: string
}

export function Chip({ tone, iconName, label, title }: ChipProps): React.JSX.Element {
  return (
    <span
      title={title ?? label}
      className={`inline-flex max-w-[14rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${TONE_CLASS[tone]}`}
    >
      {iconName ? <Icon name={iconName} size={11} /> : null}
      <span className="truncate">{label}</span>
    </span>
  )
}
