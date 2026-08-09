import { useEffect } from 'react'
import { locateSelfProject, proposeRepair } from '../../services/repair-service'
import { useRepairStore } from '../../stores/repair-store'
import { Icon } from '../common/Icon'
import { RepairProposalRow } from './RepairProposalRow'

/**
 * Motor de reparacion disciplinado, incremento I1: C1 ELIGE el hallazgo mas
 * contenido y C2 lo ENTIENDE contra el codigo real (REAL u OBSOLETO). No
 * genera fix ni toca el arbol: eso llega en incrementos posteriores, con
 * worktree, gate, OMEGA y firma humana. Debut: solo el propio repo.
 */
export function RepairSection(): React.JSX.Element {
  const projectId = useRepairStore((state) => state.projectId)
  const proposals = useRepairStore((state) => state.proposals)
  const findings = useRepairStore((state) => state.findings)
  const busy = useRepairStore((state) => state.busy)

  useEffect(() => {
    void locateSelfProject()
  }, [])

  const findingById = new Map(findings.map((finding) => [finding.id, finding]))
  const ordered = [...proposals].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <section>
      <h2 className="text-base text-foreground">Motor de reparacion</h2>
      <p className="text-xs text-muted-foreground">
        C1 elige y C2 verifica contra el codigo vivo antes de proponer nada.
      </p>
      <button
        type="button"
        disabled={busy || projectId === null}
        onClick={() => void proposeRepair()}
        className="mt-2 flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs text-foreground hover:border-primary/50 disabled:opacity-50"
      >
        <Icon name="wrench" size={12} />
        {busy ? 'Analizando...' : 'Proponer reparacion'}
      </button>
      {projectId === null ? (
        <p className="mt-2 text-xs text-muted-foreground">
          El propio repo de FORTRESS no esta registrado como proyecto.
        </p>
      ) : null}
      <div className="mt-2 space-y-1">
        {ordered.map((proposal) => (
          <RepairProposalRow
            key={proposal.id}
            proposal={proposal}
            finding={findingById.get(proposal.findingId)}
          />
        ))}
      </div>
    </section>
  )
}
