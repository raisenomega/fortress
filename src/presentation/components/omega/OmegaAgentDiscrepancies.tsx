import type { OmegaEntry } from '@domain/omega/omega-entry'

interface OmegaAgentDiscrepanciesProps {
  readonly entries: readonly OmegaEntry[]
}

/** Discrepancias que OMEGA le detecto a este agente (spec §3), verificables. */
export function OmegaAgentDiscrepancies({
  entries
}: OmegaAgentDiscrepanciesProps): React.JSX.Element {
  const disc = entries.filter((e) => e.verdict === 'discrepancia')

  if (disc.length === 0) {
    return <p className="text-xs text-muted-foreground">OMEGA no le detecto discrepancias.</p>
  }

  return (
    <ul className="space-y-1">
      {disc.map((entry) => (
        <li key={entry.id} className="rounded border border-border px-2 py-1 text-xs">
          <span className="text-critical">discrepancia</span>{' '}
          <span className="text-foreground">{entry.summary}</span>
          {entry.evidence ? (
            <span className="ml-1 font-mono text-[10px] text-muted-foreground">{entry.evidence}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
