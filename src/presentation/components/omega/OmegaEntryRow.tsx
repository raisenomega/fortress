import type { OmegaEntry } from '@domain/omega/omega-entry'

const TONE: Record<string, string> = {
  ok: 'text-success',
  discrepancia: 'text-critical',
  info: 'text-muted-foreground'
}

interface OmegaEntryRowProps {
  readonly entry: OmegaEntry
}

/** Un asiento del Libro de la Vida: veredicto + lo verificado + evidencia. */
export function OmegaEntryRow({ entry }: OmegaEntryRowProps): React.JSX.Element {
  return (
    <li className="rounded-md border border-border bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold uppercase ${TONE[entry.verdict] ?? ''}`}>
          {entry.verdict}
        </span>
        <span className="truncate text-xs text-foreground">{entry.summary}</span>
      </div>
      {entry.evidence ? (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{entry.evidence}</p>
      ) : null}
    </li>
  )
}
