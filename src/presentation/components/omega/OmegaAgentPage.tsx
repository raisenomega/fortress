import { useState } from 'react'
import { findAgent } from '@domain/agent/agent-catalog'
import type { AgentId } from '@domain/agent/agent'
import type { AgentHealth } from '@domain/omega/agent-health'
import type { AgentRun } from '@domain/telemetry/agent-run'
import { useAgentRuns } from '../../hooks/useAgentRuns'
import { pageFields, pageHighlights } from './agent-page-model'
import { OmegaExecPanel } from './OmegaExecPanel'
import { OmegaFieldGrid } from './OmegaFieldGrid'
import { OmegaHighlights } from './OmegaHighlights'
import { OmegaHistoryTable } from './OmegaHistoryTable'
import { OmegaPageHeader } from './OmegaPageHeader'
import { OmegaProjectChips } from './OmegaProjectChips'
import { OmegaSection } from './OmegaSection'

const PER_PAGE = 6

interface OmegaAgentPageProps {
  readonly agent: AgentHealth
  readonly agents: readonly AgentHealth[]
  readonly projects: ReadonlyArray<{ readonly id: string; readonly name: string }>
  readonly onBack: () => void
}

/** Pagina dedicada del agente (spec): header, grid, destacados, historial, barra lateral. */
export function OmegaAgentPage({ agent, agents, projects, onBack }: OmegaAgentPageProps): React.JSX.Element {
  const runs = useAgentRuns(agent.agentId)
  const [filter, setFilter] = useState<string | null>(null)
  const [sel, setSel] = useState<AgentRun | null>(null)
  const [page, setPage] = useState(0)

  const filtered = filter ? runs.filter((r) => r.projectId === filter) : runs
  const conRuns = projects.filter((p) => runs.some((r) => r.projectId === p.id))

  return (
    <div className="h-full space-y-4 overflow-y-auto px-4 py-4">
      <button type="button" onClick={onBack} className="tap text-xs text-primary">
        ‹ Volver a agentes
      </button>
      <OmegaPageHeader
        name={agent.name}
        subtitle={findAgent(agent.agentId as AgentId)?.purpose ?? ''}
        effectiveness={agent.compliance}
        runs={agent.runs}
        tokens={agent.outputTokens}
      />
      <OmegaFieldGrid fields={pageFields(agent)} />
      <OmegaHighlights items={pageHighlights(agent, agents)} />
      <OmegaSection title="Historial">
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
          onRow={setSel}
        />
      </OmegaSection>
      {sel ? <OmegaExecPanel run={sel} onClose={() => setSel(null)} /> : null}
    </div>
  )
}
