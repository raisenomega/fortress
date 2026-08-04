import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import { OmegaEntryRow } from './OmegaEntryRow'

interface OmegaAgentDiscrepanciesProps {
  readonly entries: readonly OmegaEntry[]
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
}

/**
 * Discrepancias que OMEGA le detecto (spec §3). Reutiliza la fila del log: cada
 * una lleva su "ver evidencia" (codigo real), evidencia siempre accesible.
 */
export function OmegaAgentDiscrepancies({
  entries,
  loadSnippet
}: OmegaAgentDiscrepanciesProps): React.JSX.Element {
  const disc = entries.filter((e) => e.verdict === 'discrepancia')

  if (disc.length === 0) {
    return <p className="text-xs text-muted-foreground">OMEGA no le detecto discrepancias.</p>
  }

  return (
    <ul className="space-y-2">
      {disc.map((entry) => (
        <OmegaEntryRow key={entry.id} entry={entry} loadSnippet={loadSnippet} />
      ))}
    </ul>
  )
}
