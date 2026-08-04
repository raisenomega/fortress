import { costLabel } from '@domain/telemetry/billing-mode'
import { formatCost, formatTokens } from '@domain/telemetry/format-usage'
import { totalTokens } from '@domain/telemetry/token-usage'
import { useLoopStatus } from '../../stores/loop-store'
import { useActiveProject } from '../../stores/project-store'
import { useRunMeterStore } from '../../stores/run-meter-store'
import { useTelemetryStore } from '../../stores/telemetry-store'
import { LoopMeter } from './LoopMeter'
import { RunMeter } from '../chat/RunMeter'

/**
 * Agentes, tiempo y tokens SIEMPRE visibles en el pie, desde cualquier pantalla.
 * Mientras corre, la frase en vivo (agentes/tiempo/gasto); parado, el total de
 * la sesion, que lee la base y es la cifra fiable.
 */
export function FooterMeter(): React.JSX.Element {
  const running = useRunMeterStore((state) => state.startedAt !== null)
  const session = useTelemetryStore((state) => state.session)
  const billing = useTelemetryStore((state) => state.billing)
  const loop = useLoopStatus(useActiveProject()?.id ?? null)

  // El loop corre en el main: se muestra en el pie en vivo, como el chat.
  if (loop && loop.stopReason === null) return <LoopMeter status={loop} />
  if (running) return <RunMeter />

  const cost = formatCost(session.costUsd)
  return (
    <span className="font-mono text-primary">
      {formatTokens(totalTokens(session))} tok
      {cost ? ` · ${costLabel(billing).toLowerCase()} ${cost}` : ''}
    </span>
  )
}
