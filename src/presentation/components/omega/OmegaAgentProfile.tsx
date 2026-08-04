import type { AgentHealth } from '@domain/omega/agent-health'
import { compliancePercentile } from '@domain/omega/agent-percentile'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import type { AgentRun } from '@domain/telemetry/agent-run'
import { OmegaAgentDiscrepancies } from './OmegaAgentDiscrepancies'
import { OmegaAgentHistory } from './OmegaAgentHistory'
import { OmegaMetricsTable, type ProfileMetric } from './OmegaMetricsTable'
import { OmegaPerfChart } from './OmegaPerfChart'
import { OmegaProfileActions } from './OmegaProfileActions'
import { OmegaProfileHeader } from './OmegaProfileHeader'
import { OmegaSection } from './OmegaSection'

export interface OmegaAgentProfileProps {
  readonly projectId: string
  readonly projectName: string
  readonly agentId: string
  readonly busy: boolean
  readonly agents: readonly AgentHealth[]
  readonly runs: readonly AgentRun[]
  readonly log: readonly OmegaEntry[]
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
}

function bandOf(c: number | null): { readonly band: string; readonly tone: string } {
  if (c === null) return { band: 'sin datos', tone: 'text-muted-foreground' }
  if (c >= 75) return { band: 'confiable', tone: 'text-success' }
  if (c >= 50) return { band: 'cuestionable', tone: 'text-medium' }
  return { band: 'no confiable', tone: 'text-critical' }
}

/** Perfil completo del agente (spec §3): cabecera, metricas, historial, discrepancias, grafica. */
export function OmegaAgentProfile(props: OmegaAgentProfileProps): React.JSX.Element | null {
  const agent = props.agents.find((a) => a.agentId === props.agentId)
  if (!agent) return null

  const misRuns = props.runs.filter((r) => r.agentId === props.agentId)
  const misEntradas = props.log.filter((e) => e.agentId === props.agentId)
  const pct = compliancePercentile(props.agents, props.agentId)
  const metrics: readonly ProfileMetric[] = [
    { label: 'Confiabilidad', value: agent.compliance === null ? 's/d' : `${agent.compliance}%`, percentil: pct === null ? 's/d' : `${pct}%` },
    { label: 'Eficiencia', value: agent.tokensPerRun === null ? 's/d' : `${agent.tokensPerRun} tok/ejec`, percentil: 's/d' },
    { label: 'Discrepancias', value: String(agent.discrepancies), percentil: 's/d' }
  ]

  return (
    <div className="space-y-4">
      <OmegaProfileHeader
        {...bandOf(agent.compliance)}
        lastAudit={misEntradas[0]?.at.slice(0, 19).replace('T', ' ') ?? null}
        projectName={props.projectName}
      />
      <OmegaSection title="Metricas"><OmegaMetricsTable metrics={metrics} /></OmegaSection>
      <OmegaSection title="Historial de ejecuciones"><OmegaAgentHistory runs={misRuns} /></OmegaSection>
      <OmegaSection title="Grafica de rendimiento"><OmegaPerfChart runs={misRuns} /></OmegaSection>
      <OmegaSection title="Discrepancias detectadas">
        <OmegaAgentDiscrepancies entries={misEntradas} loadSnippet={props.loadSnippet} />
      </OmegaSection>
      <OmegaProfileActions projectId={props.projectId} busy={props.busy} />
    </div>
  )
}
