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
 * Medidor del loop en el pie: fase, ciclo y gasto, en vivo mientras corre, igual
 * que el del chat. Ciclo actual en rojo / total en verde, como en el HUD.
 */
export function LoopMeter({ status }: { status: LoopStatus }): React.JSX.Element {
  const current = Math.min(status.cycle, status.maxCycles)
  return (
    <span className="font-mono text-primary">
      loop · {PHASE[status.phase]} · ciclo <span className="text-critical">{current}</span>
      <span className="text-success">/{status.maxCycles}</span> · ${status.spentSession.toFixed(2)}/
      {status.costCap}
    </span>
  )
}
