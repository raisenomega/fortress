export type ChipTone = 'agent' | 'project' | 'mode'

const TONE_CLASS: Record<ChipTone, string> = {
  agent: 'border-primary/40 bg-primary/10 text-primary',
  project: 'border-border bg-secondary text-muted-foreground',
  mode: 'border-border bg-muted/50 text-muted-foreground'
}

interface ChipProps {
  readonly tone: ChipTone
  readonly icon?: string
  readonly label: string
  readonly title?: string
}

export function Chip({ tone, icon, label, title }: ChipProps): React.JSX.Element {
  return (
    <span
      title={title ?? label}
      className={`inline-flex max-w-[14rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${TONE_CLASS[tone]}`}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      <span className="truncate">{label}</span>
    </span>
  )
}
