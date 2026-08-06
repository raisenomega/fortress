import type { Project } from '@domain/project/project'
import { SOLVED_STREAK } from '@domain/loop/loop-decision'
import { STOP_LABEL, type LoopPhase } from '@domain/loop/loop-status'
import { useLoopStatus } from '../../stores/loop-store'

const PHASE_LABEL: Record<LoopPhase, string> = {
  escaneando: 'Escaneando',
  esperando: 'Esperando',
  reparando: 'Agentes trabajando',
  verificando: 'Verificando',
  debate: 'Debate (buscando mejor solucion)',
  standby: 'Standby (esperando al proveedor)',
  parado: 'Parado'
}

/**
 * Estado del loop del proyecto activo, en vivo. El contador de ciclos va SIEMPRE
 * visible: ciclo actual en rojo / total en verde; al completar el arco (resuelto
 * o hechos todos los ciclos) se pone todo verde.
 */
export function LoopHud({ project }: { project: Project }): React.JSX.Element | null {
  const status = useLoopStatus(project.id)
  if (!status) return null

  const label = status.stopReason ? STOP_LABEL[status.stopReason] : PHASE_LABEL[status.phase]
  const complete = status.stopReason === 'resuelto' || status.stopReason === 'tope-ciclos'
  const current = Math.min(status.cycle, status.maxCycles)
  const border = complete
    ? 'border-success/60'
    : status.phase === 'standby'
      ? 'border-medium/50'
      : 'border-primary/40'
  const base = complete
    ? 'text-success'
    : status.phase === 'standby'
      ? 'text-medium'
      : 'text-primary'

  return (
    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${border} ${base}`}>
      Loop · {label} · ciclo{' '}
      <span className={complete ? 'text-success' : 'text-critical'}>{current}</span>
      <span className="text-success">/{status.maxCycles}</span>
      {status.solvedStreak > 0 && (
        <span className="text-success font-semibold">
          {' '}
          · 100 seguidos {status.solvedStreak}/{SOLVED_STREAK}
        </span>
      )}{' '}
      · ${status.spentSession.toFixed(2)}/{status.costCap}
    </span>
  )
}
