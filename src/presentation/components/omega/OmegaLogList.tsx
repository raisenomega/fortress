import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import { OmegaEntryRow } from './OmegaEntryRow'

interface OmegaLogListProps {
  readonly entries: readonly OmegaEntry[]
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
}

export function OmegaLogList({ entries, loadSnippet }: OmegaLogListProps): React.JSX.Element {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        El Libro de la Vida esta vacio. Audita el proyecto para escribir el primer asiento.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <OmegaEntryRow key={entry.id} entry={entry} loadSnippet={loadSnippet} />
      ))}
    </ul>
  )
}
