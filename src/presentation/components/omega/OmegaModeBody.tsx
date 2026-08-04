import type { AgentHealth } from '@domain/omega/agent-health'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { OmegaEntry } from '@domain/omega/omega-entry'
import type { OmegaScore } from '@domain/omega/omega-score'
import type { Finding, Project } from '@domain/project/project'
import type { OmegaMode } from '../../stores/omega-store'
import { OmegaAgentPage } from './OmegaAgentPage'
import { OmegaAgentsView } from './OmegaAgentsView'
import { OmegaCodeView } from './OmegaCodeView'
import { OmegaConfigView } from './OmegaConfigView'
import { OmegaProjectsView } from './OmegaProjectsView'

interface OmegaModeBodyProps {
  readonly mode: OmegaMode
  readonly project: Project
  readonly agents: readonly AgentHealth[]
  readonly score: OmegaScore | null
  readonly log: readonly OmegaEntry[]
  readonly findings: readonly Finding[]
  readonly projects: readonly Project[]
  readonly busy: boolean
  readonly selectedAgent: string | null
  readonly onSelectAgent: (agentId: string) => void
  readonly onBack: () => void
  readonly loadSnippet: (file: string, line: number) => Promise<FileSnippet | null>
}

/** Cuerpo del superdashboard segun la pestaña. En Agentes, si hay uno elegido,
 *  su pagina toma el cuerpo (las pestañas del header siguen visibles). */
export function OmegaModeBody(props: OmegaModeBodyProps): React.JSX.Element {
  if (props.mode === 'agentes') {
    const agent = props.agents.find((a) => a.agentId === props.selectedAgent)
    if (agent) {
      return (
        <OmegaAgentPage
          agent={agent}
          agents={props.agents}
          projects={props.projects.map((p) => ({ id: p.id, name: p.name }))}
          projectId={props.project.id}
          busy={props.busy}
          log={props.log}
          loadSnippet={props.loadSnippet}
          onBack={props.onBack}
        />
      )
    }
    return <OmegaAgentsView agents={props.agents} score={props.score} onSelect={props.onSelectAgent} />
  }
  if (props.mode === 'codigo') {
    return (
      <OmegaCodeView
        project={props.project}
        findings={props.findings}
        log={props.log}
        busy={props.busy}
        loadSnippet={props.loadSnippet}
      />
    )
  }
  if (props.mode === 'proyectos') {
    return <OmegaProjectsView projects={props.projects} />
  }
  return <OmegaConfigView />
}
