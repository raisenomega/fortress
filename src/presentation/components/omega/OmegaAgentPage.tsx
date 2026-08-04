import { useState } from 'react'
import { findAgent } from '@domain/agent/agent-catalog'
import type { AgentId } from '@domain/agent/agent'
import type { AgentHealth } from '@domain/omega/agent-health'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import type { AgentRun } from '@domain/telemetry/agent-run'
import { useAgentRuns } from '../../hooks/useAgentRuns'
import { pageMetrics } from './agent-page-model'
import { OmegaDiscrepancyList } from './OmegaDiscrepancyList'
import { OmegaDiscrepancyPanel } from './OmegaDiscrepancyPanel'
import { OmegaExecPanel } from './OmegaExecPanel'
import { OmegaHeader } from './OmegaHeader'
import { OmegaHistorySection } from './OmegaHistorySection'
import { OmegaMetricsTable } from './OmegaMetricsTable'
import { OmegaPageHeader } from './OmegaPageHeader'
import { OmegaPerfChart } from './OmegaPerfChart'
import { OmegaProfileActions } from './OmegaProfileActions'
import { OmegaSection } from './OmegaSection'

export interface OmegaAgentPageProps {
  readonly agent: AgentHealth
  readonly agents: readonly AgentHealth[]
  readonly projects: ReadonlyArray<{ readonly id: string; readonly name: string }>
  readonly projectId: string
  readonly busy: boolean
  readonly log: readonly OmegaEntry[]
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
  readonly onBack: () => void
}

/** Pagina del agente en el orden del spec; cada fila/discrepancia abre barra lateral. */
export function OmegaAgentPage(props: OmegaAgentPageProps): React.JSX.Element {
  const { agent, agents, projects, projectId, busy, log, loadSnippet, onBack } = props
  const runs = useAgentRuns(agent.agentId)
  const [selRun, setSelRun] = useState<AgentRun | null>(null)
  const [selDisc, setSelDisc] = useState<OmegaEntry | null>(null)
  const mias = log.filter((e) => e.agentId === agent.agentId)

  return (
    <div className="h-full space-y-4 overflow-y-auto px-4 py-4">
      <button type="button" onClick={onBack} className="tap text-xs text-primary">
        ‹ Volver a agentes
      </button>
      <OmegaHeader projectId={projectId} log={log} busy={busy} />
      <OmegaPageHeader
        name={agent.name}
        subtitle={findAgent(agent.agentId as AgentId)?.purpose ?? ''}
        score={agent.compliance}
        runs={agent.runs}
        tokens={agent.outputTokens}
      />
      <OmegaSection title="Metricas">
        <OmegaMetricsTable metrics={pageMetrics(agent, agents)} />
      </OmegaSection>
      <OmegaSection title="Historial de ejecuciones">
        <OmegaHistorySection runs={runs} projects={projects} onRow={setSelRun} />
      </OmegaSection>
      <OmegaSection title="Discrepancias detectadas">
        <OmegaDiscrepancyList entries={mias} onSelect={setSelDisc} />
      </OmegaSection>
      <OmegaSection title="Grafica de rendimiento">
        <OmegaPerfChart runs={runs} />
      </OmegaSection>
      <OmegaProfileActions projectId={projectId} busy={busy} />
      {selRun ? <OmegaExecPanel run={selRun} onClose={() => setSelRun(null)} /> : null}
      {selDisc ? (
        <OmegaDiscrepancyPanel entry={selDisc} loadSnippet={loadSnippet} onClose={() => setSelDisc(null)} />
      ) : null}
    </div>
  )
}
