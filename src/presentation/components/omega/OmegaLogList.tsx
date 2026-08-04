import type { OmegaEntry } from '@domain/omega/omega-entry'
import { OmegaEntryRow } from './OmegaEntryRow'

interface OmegaLogListProps {
  readonly entries: readonly OmegaEntry[]
}

export function OmegaLogList({ entries }: OmegaLogListProps): React.JSX.Element {
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
        <OmegaEntryRow key={entry.id} entry={entry} />
      ))}
    </ul>
  )
}
