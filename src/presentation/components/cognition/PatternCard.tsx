import type { CognitionPattern } from '@domain/cognition/cognition-log'
import { SeverityBadge } from '../scan/SeverityBadge'
import { PatternStatusBadge } from './PatternStatusBadge'

interface PatternCardProps {
  readonly pattern: CognitionPattern
}

export function PatternCard({ pattern }: PatternCardProps): React.JSX.Element {
  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <header className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-primary">{pattern.id}</span>
        <PatternStatusBadge status={pattern.status} />
        {pattern.severity ? <SeverityBadge severity={pattern.severity} /> : null}
      </header>

      <p className="mt-1.5 text-sm text-foreground">{pattern.title}</p>

      <p className="mt-1 text-[11px] text-muted-foreground">
        {pattern.detectedAt ? `Detectado ${pattern.detectedAt}` : 'Sin fecha registrada'}
        {pattern.recurrences !== null ? ` · ${pattern.recurrences} detecciones` : ''}
      </p>
    </article>
  )
}
