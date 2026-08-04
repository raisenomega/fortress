import type { OmegaEntry } from '@domain/omega/omega-entry'

interface OmegaFileHistoryProps {
  readonly entries: readonly OmegaEntry[]
  readonly file: string
  readonly excludeId: string
}

/** Otros asientos del Libro de la Vida sobre el MISMO archivo. Histórico real. */
export function OmegaFileHistory({
  entries,
  file,
  excludeId
}: OmegaFileHistoryProps): React.JSX.Element {
  const same = entries.filter((e) => e.id !== excludeId && e.evidence.split(':')[0] === file)

  if (same.length === 0) {
    return <span>Sin otros asientos de este archivo en el Libro de la Vida.</span>
  }

  return (
    <ul className="space-y-1">
      {same.map((entry) => (
        <li key={entry.id}>
          <span className="text-muted-foreground">{entry.agentId ?? 'sistema'}</span> ·{' '}
          <span className={entry.verdict === 'ok' ? 'text-success' : 'text-critical'}>
            {entry.verdict}
          </span>{' '}
          · {entry.summary}
        </li>
      ))}
    </ul>
  )
}
