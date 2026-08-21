import { proposeRepair } from '../../services/repair-service'
import { useActiveProject } from '../../stores/project-store'
import { useRepairStore } from '../../stores/repair-store'
import { CercoNotice } from './CercoNotice'
import { Icon } from '../common/Icon'
import { RepairProposalRow } from './RepairProposalRow'
import { useRepairFeed } from '../../hooks/useRepairFeed'

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
export function MotorView(): React.JSX.Element {
  const project = useActiveProject()
  const projectId = project?.id ?? null
  const cargado = useRepairStore((state) => state.projectId)
  const proposals = useRepairStore((state) => state.proposals)
  const findings = useRepairStore((state) => state.findings)
  const busy = useRepairStore((state) => state.busy)
  const cerco = useRepairStore((state) => state.cerco)

  useRepairFeed(projectId)

  const alDia = cargado === projectId
  const findingById = new Map(findings.map((finding) => [finding.id, finding]))
  const ordered = alDia ? [...proposals].sort((a, b) => b.updatedAt - a.updatedAt) : []

  return (
    <div className="h-full space-y-3 overflow-y-auto px-4 py-4">
      <header>
        <h2 className="text-base text-foreground">Motor de reparacion</h2>
        <p className="text-xs text-muted-foreground">
          {project === null
            ? 'Selecciona un proyecto para ver su expediente.'
            : `Expediente de ${project.name}. Nada se integra sin pasar el gate y el revisor.`}
        </p>
      </header>

      {alDia ? <CercoNotice cerco={cerco} /> : null}

      <button
        type="button"
        disabled={busy || projectId === null}
        onClick={() => projectId !== null && void proposeRepair(projectId)}
        className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs text-foreground hover:border-primary/50 disabled:opacity-50"
      >
        <Icon name="wrench" size={12} />
        {busy ? 'Analizando...' : 'Proponer reparacion'}
      </button>

      <div className="space-y-1">
        {ordered.map((proposal) => (
          <RepairProposalRow
            key={proposal.id}
            proposal={proposal}
            finding={findingById.get(proposal.findingId)}
          />
        ))}
      </div>
    </div>
  )
}
