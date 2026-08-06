import type { Finding } from '@domain/project/project'
import type { Severity } from '@domain/shared/severity'
import { onActivate } from '../common/activate'

const TONE: Record<Severity, string> = {
  CRITICAL: 'text-critical',
  HIGH: 'text-critical',
  MEDIUM: 'text-medium',
  LOW: 'text-success'
}

interface OmegaFindingGroupProps {
  readonly severity: Severity
  readonly findings: readonly Finding[]
  readonly onSelect: (finding: Finding) => void
}

/** Grupo de vulnerabilidades de una severidad; click en una abre su barra lateral. */
export function OmegaFindingGroup({
  severity,
  findings,
  onSelect
}: OmegaFindingGroupProps): React.JSX.Element | null {
  const items = findings.filter((f) => f.severity === severity && f.status === 'open')
  if (items.length === 0) return null

  return (
    <div className="space-y-1">
      <p className={`text-[10px] tracking-widest uppercase ${TONE[severity]}`}>
        {severity} ({items.length})
      </p>
      <ul className="divide-y divide-border rounded-md border border-border">
        {items.map((f) => (
          <li
            key={f.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(f)}
            onKeyDown={onActivate(() => onSelect(f))}
            className="tap cursor-pointer px-2 py-1.5 text-xs hover:bg-secondary/40"
          >
            <span className="text-foreground">{f.title}</span>
            <span className="ml-1 font-mono text-[10px] text-muted-foreground">
              {f.file}
              {f.line ? `:${f.line}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
