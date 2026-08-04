import { useState } from 'react'
import type { AgentRun } from '@domain/telemetry/agent-run'
import { OmegaHistoryTable } from './OmegaHistoryTable'
import { OmegaProjectChips } from './OmegaProjectChips'

const PER_PAGE = 6

interface OmegaHistorySectionProps {
  readonly runs: readonly AgentRun[]
  readonly projects: ReadonlyArray<{ readonly id: string; readonly name: string }>
  readonly onRow: (run: AgentRun) => void
}

/** Historial con chips de proyecto (filtran) y paginacion de 6; dueño de su estado. */
export function OmegaHistorySection({
  runs,
  projects,
  onRow
}: OmegaHistorySectionProps): React.JSX.Element {
  const [filter, setFilter] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const filtered = filter ? runs.filter((r) => r.projectId === filter) : runs
  const conRuns = projects.filter((p) => runs.some((r) => r.projectId === p.id))

  return (
    <div className="space-y-2">
      <OmegaProjectChips
        projects={conRuns}
        active={filter}
        onSelect={(id) => {
          setFilter(id)
          setPage(0)
        }}
      />
      <OmegaHistoryTable
        runs={filtered}
        page={page}
        pages={Math.max(1, Math.ceil(filtered.length / PER_PAGE))}
        onPage={setPage}
        onRow={onRow}
      />
    </div>
  )
}
