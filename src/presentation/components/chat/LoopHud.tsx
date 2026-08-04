import type { Project } from '@domain/project/project'
import { STOP_LABEL, type LoopPhase } from '@domain/loop/loop-status'
import { useLoopStatus } from '../../stores/loop-store'

const PHASE_LABEL: Record<LoopPhase, string> = {
  escaneando: 'Escaneando',
  esperando: 'Esperando',
  reparando: 'Agentes trabajando',
  verificando: 'Verificando',
  standby: 'Standby (esperando al proveedor)',
  parado: 'Parado'
}

/** Estado del loop del proyecto activo, en vivo. Nulo si el loop nunca reporto. */
export function LoopHud({ project }: { project: Project }): React.JSX.Element | null {
  const status = useLoopStatus(project.id)
  if (!status) return null

  const label = status.stopReason ? STOP_LABEL[status.stopReason] : PHASE_LABEL[status.phase]
  const tone = status.phase === 'standby' ? 'border-medium/50 text-medium' : 'border-primary/40 text-primary'

  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${tone}`}>
      Loop · {label} · ciclo {status.cycle}/{status.maxCycles} · $
      {status.spentSession.toFixed(2)}/{status.costCap}
    </span>
  )
}
