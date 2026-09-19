import { useEffect, useState } from 'react'
import { etiquetaDeFase, type FaseDelTurno } from '@domain/chat/fase-del-turno'
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
/**
 * El tono de cada fase. Nunca un color a mano: token del tema (CLAUDE.md).
 *
 * `Record` y no un ternario: una fase nueva no compila hasta que alguien decide
 * como se ve. Es lo que obligo a elegir el azul del juicio en vez de dejarlo
 * heredando el color de al lado sin que nadie lo notara.
 */
// El azul es «OMEGA esta pensando», y por eso el plan lo comparte con el juicio:
// es la misma cabeza haciendo lo mismo, en dos momentos. Lo que los separa es la
// etiqueta —un plan no es un diff—, no el color.
const TONO: Record<FaseDelTurno, string> = {
  debate: 'text-high',
  juicio: 'text-proceso',
  plan: 'text-proceso'
}

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
