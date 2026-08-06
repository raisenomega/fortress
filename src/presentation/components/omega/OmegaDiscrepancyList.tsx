import type { OmegaEntry } from '@domain/omega/omega-entry'
import { onActivate } from '../common/activate'

interface OmegaDiscrepancyListProps {
  readonly entries: readonly OmegaEntry[]
  readonly onSelect: (entry: OmegaEntry) => void
}

/** Discrepancias del agente; click en una abre su barra lateral con el detalle. */
export function OmegaDiscrepancyList({
  entries,
  onSelect
}: OmegaDiscrepancyListProps): React.JSX.Element {
  const disc = entries.filter((e) => e.verdict === 'discrepancia')

  if (disc.length === 0) {
    return <p className="text-xs text-muted-foreground">OMEGA no le detecto discrepancias.</p>
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {disc.map((entry) => (
        <li
          key={entry.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(entry)}
          onKeyDown={onActivate(() => onSelect(entry))}
          className="tap cursor-pointer px-2 py-1.5 text-xs hover:bg-secondary/40"
        >
          <span className="text-critical">discrepancia</span>{' '}
          <span className="text-foreground">{entry.summary}</span>
          {entry.evidence ? (
            <span className="ml-1 font-mono text-[10px] text-muted-foreground">
              {entry.evidence}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
