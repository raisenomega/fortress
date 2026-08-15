import { SOLVED_STREAK } from '@domain/loop/loop-decision'
import type { LoopPhase, LoopStatus } from '@domain/loop/loop-status'

const PHASE: Record<LoopPhase, string> = {
  escaneando: 'escaneando',
  esperando: 'esperando',
  reparando: 'agentes',
  verificando: 'verificando',
  debate: 'debate',
  standby: 'standby',
  parado: 'parado'
}

/**
 * Medidor del loop en el pie: fase, propuesta y gasto, en vivo mientras corre,
 * igual que el del chat. La actual en rojo / el tope en verde, como en el HUD.
 */
export function LoopMeter({ status }: { status: LoopStatus }): React.JSX.Element {
  const current = Math.min(status.cycle, status.maxCycles)
  return (
    <span className="font-mono text-primary">
      loop · {PHASE[status.phase]} · propuesta <span className="text-critical">{current}</span>
      <span className="text-success">/{status.maxCycles}</span>
      {status.solvedStreak > 0 && (
        <span className="text-success font-semibold">
          {' '}
          · 100×{status.solvedStreak}/{SOLVED_STREAK}
        </span>
      )}{' '}
      · ${status.spentSession.toFixed(2)}/{status.costCap}
    </span>
  )
}
