import type { Project } from '@domain/project/project'
import { useActiveProject } from '../../stores/project-store'
import { useRepairStore } from '../../stores/repair-store'
import { AvisoContaminacion } from './AvisoContaminacion'
import { DrenajeEnVivo } from './DrenajeEnVivo'
import { MotorAcciones } from './MotorAcciones'
import { colaDeFirma } from './cola-de-firma'
import { RepairProposalRow } from './RepairProposalRow'
import { useRepairFeed } from '../../hooks/useRepairFeed'
import { usePaginado } from '../../hooks/usePaginado'
import { Paginador } from './Paginador'

/**
 * Motor de reparacion del proyecto ACTIVO: C1 elige el hallazgo mas contenido,
 * C2 lo verifica contra el codigo vivo, C3 genera el fix en un worktree
 * aislado, el gate lo compila y OMEGA lo juzga. Cada propuesta trae su libro
 * de vida al desplegarla.
 *
 * Nacio limitado al propio repo de FORTRESS. Ya no: opera sobre cualquier
 * proyecto registrado. La integracion automatica sigue apagada en todos hasta
 * que cada uno la declare en su `.fortress/config`.
 */
const subtitulo = (project: Project | null): string =>
  project === null
    ? 'Selecciona un proyecto para ver su expediente.'
    : `Expediente de ${project.name}. Lo que espera firma vive en su propia pagina.`

export function MotorView(): React.JSX.Element {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const cargado = useRepairStore((state) => state.projectId)
  const proposals = useRepairStore((state) => state.proposals)
  const findings = useRepairStore((state) => state.findings)
  const cerco = useRepairStore((state) => state.cerco)
  const drenando = useRepairStore((state) => state.drenando)

  useRepairFeed(projectId)

  const alDia = cargado === projectId
  const findingById = new Map(findings.map((finding) => [finding.id, finding]))
  const ordered = alDia ? [...proposals].sort((a, b) => b.updatedAt - a.updatedAt) : []
  const cola = alDia ? colaDeFirma(proposals, findings) : []
  const { visibles, pagina, irA } = usePaginado(ordered)

  return (
    <div className="h-full space-y-3 overflow-y-auto px-4 py-4">
      <header>
        <h2 className="text-base text-foreground">Motor de reparacion</h2>
        <p className="text-xs text-muted-foreground">{subtitulo(project ?? null)}</p>
      </header>

      {alDia && drenando ? <DrenajeEnVivo cerco={cerco} esperandoFirma={cola.length} /> : null}

      {project?.contaminated ? <AvisoContaminacion project={project} /> : null}
      <MotorAcciones projectId={projectId} />

      <div className="space-y-1">
        {visibles.map((proposal) => (
          <RepairProposalRow
            key={proposal.id}
            proposal={proposal}
            finding={findingById.get(proposal.findingId)}
          />
        ))}
      </div>
      <Paginador pagina={pagina} onPagina={irA} />
    </div>
  )
}
