import { useCallback } from 'react'
import type { FileSnippet } from '@domain/omega/filesystem-probe'
import type { Project } from '@domain/project/project'
import { fetchSnippet } from '../../services/omega-service'
import { useOmega, useOmegaStore } from '../../stores/omega-store'
import { useProjectStore } from '../../stores/project-store'
import { useProjectFindings } from '../../stores/scan-selectors'
import { OmegaHeader } from './OmegaHeader'
import { OmegaModeBody } from './OmegaModeBody'

interface OmegaDashboardProps {
  readonly project: Project
}

/** Superdashboard con pestañas: el header cambia el modo, el cuerpo el scope. */
export function OmegaDashboard({ project }: OmegaDashboardProps): React.JSX.Element {
  const id = project.id
  const data = useOmega(id)
  const auditing = useOmegaStore((s) => s.auditing)
  const selected = useOmegaStore((s) => s.selectedAgent)
  const selectAgent = useOmegaStore((s) => s.selectAgent)
  const mode = useOmegaStore((s) => s.mode)
  const projects = useProjectStore((s) => s.projects)
  const findings = useProjectFindings(id)
  // Estable por proyecto: los paneles la incluyen en sus deps sin re-cargar.
  const snippet = useCallback(
    (file: string, line: number): Promise<FileSnippet | null> => fetchSnippet(id, file, line),
    [id]
  )

  return (
    <div className="h-full space-y-5 overflow-y-auto px-4 py-4">
      <OmegaHeader
        projectId={id}
        projectName={project.name}
        lastScan={project.lastScan}
        log={data.log}
        busy={auditing === id}
      />
      <OmegaModeBody
        mode={mode}
        project={project}
        agents={data.agents}
        score={data.score}
        log={data.log}
        findings={findings}
        projects={projects}
        busy={auditing === id}
        selectedAgent={selected}
        onSelectAgent={selectAgent}
        onBack={() => selectAgent(null)}
        loadSnippet={snippet}
      />
    </div>
  )
}
