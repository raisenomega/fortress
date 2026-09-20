import { useEffect, useState } from 'react'
import { etiquetaDeFase } from '@domain/chat/fase-del-turno'
import { TONO } from './tono-de-fase'
import { costLabel } from '@domain/telemetry/billing-mode'
import { formatCost, formatTokens } from '@domain/telemetry/format-usage'
import { formatElapsed } from '../../format/elapsed'
import { useRunMeterStore } from '../../stores/run-meter-store'
import { useTelemetryStore } from '../../stores/telemetry-store'

/**
 * Medidor en vivo mientras corre un workflow: cuantos agentes van, cuanto
 * tiempo llevan, y cuantos tokens y dinero han costado. En una frase, para
 * poder comparar de un vistazo agentes contra tiempo y gasto.
 */
export function RunMeter(): React.JSX.Element | null {
  const startedAt = useRunMeterStore((state) => state.startedAt)
  const step = useRunMeterStore((state) => state.step)
  const total = useRunMeterStore((state) => state.total)
  const tokens = useRunMeterStore((state) => state.tokens)
  const costUsd = useRunMeterStore((state) => state.costUsd)
  const fase = useRunMeterStore((state) => state.fase)
  const billing = useTelemetryStore((state) => state.billing)
  const [now, setNow] = useState(() => Date.now())

  // El cronometro late en el renderer: solo mientras algo corre.
  useEffect(() => {
    if (startedAt === null) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [startedAt])

  if (startedAt === null) return null

  // El contador de agentes solo cuenta en un workflow multi-paso (escaneo,
  // limpieza). Un turno de chat es 1 paso con TODOS los agentes disponibles como
  // subagentes: mostrar "1/1 agentes" hacia creer que solo participaba uno.
  const paso = total === 0 ? 'preparando' : total > 1 ? `${step + 1}/${total} agentes` : ''
  const cost = formatCost(costUsd)
  const prefijo = billing.mode === 'suscripcion' ? '~' : ''

  return (
    <span className="shrink-0 font-mono text-xs text-primary">
      {/* La fase manda sobre el contador: cuando hay debate, lo que importa es
          que lo hay. Texto plano y su tono; sin barra — no hay progreso que
          medir en una discusion, y una barra que avanza sola seria mentira. */}
      {fase !== undefined && <span className={TONO[fase]}>{etiquetaDeFase(fase, total)} · </span>}
      {fase === undefined && paso ? `${paso} · ` : ''}
      {formatElapsed(now - startedAt)} · {formatTokens(tokens)} tok
      {cost ? ` · ${costLabel(billing).toLowerCase()} ${prefijo}${cost}` : ''}
    </span>
  )
}
