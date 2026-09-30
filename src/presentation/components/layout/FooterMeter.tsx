import { costLabel } from '@domain/telemetry/billing-mode'
import { formatCost, formatTokens } from '@domain/telemetry/format-usage'
import { fraseSinMedir } from '../../format/sin-factura'
import { totalTokens } from '@domain/telemetry/token-usage'
import { useRunMeterStore } from '../../stores/run-meter-store'
import { useTelemetryStore } from '../../stores/telemetry-store'
import { RunMeter } from '../chat/RunMeter'

const SIN_MEDIR_TITLE =
  'Corridas que ocurrieron y cuya factura no se pudo leer: su coste no esta en el total.'

/**
 * Agentes, tiempo y tokens SIEMPRE visibles en el pie, desde cualquier pantalla.
 * Mientras corre, la frase en vivo (agentes/tiempo/gasto); parado, el total de
 * la sesion, que lee la base y es la cifra fiable.
 */
export function FooterMeter(): React.JSX.Element {
  const running = useRunMeterStore((state) => state.startedAt !== null)
  const session = useTelemetryStore((state) => state.session)
  const sinMedir = useTelemetryStore((state) => state.sinMedir)
  const billing = useTelemetryStore((state) => state.billing)
  if (running) return <RunMeter />

  const cost = formatCost(session.costUsd)
  // Lo que el total no pudo contar va PEGADO a el, no en otra pantalla: un
  // total incompleto leido solo es exactamente el problema que esto cierra.
  const falta = fraseSinMedir(sinMedir)
  return (
    <span className="font-mono text-primary">
      {formatTokens(totalTokens(session))} tok
      {cost ? ` · ${costLabel(billing).toLowerCase()} ${cost}` : ''}
      {falta === null ? null : (
        <span className="text-muted-foreground" title={SIN_MEDIR_TITLE}>
          {` · ${falta}`}
        </span>
      )}
    </span>
  )
}
