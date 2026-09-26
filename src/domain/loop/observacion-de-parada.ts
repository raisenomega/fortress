import type { SelfNoteDraft } from '../system/self-observation'
import type { LoopStopReason } from './loop-decision'

/**
 * Lo que FORTRESS aprende cuando su loop autonomo se para o espera (ROADMAP #5,
 * sub-pieza 4). Hermana de `observacionDeBarrera`, y con la misma doctrina:
 *
 * SALE DEL DATO, no de la prosa. El motivo es un vocabulario cerrado y la cifra
 * ya se compone en `detalleDeParada`; nadie le pregunta al modelo. Un TOPE es
 * FORTRESS topandose con su propio techo: `limitacion`. Romperse es un `bug`,
 * y el mensaje de la excepcion es su detalle mas util (el cerco de `add` redacta
 * lo que traiga del cliente). Parar a mano y terminar resuelto no son limites:
 * no hay nada que observar, y observarlos inflaria el backlog con exitos.
 */
const LIMITES: Partial<Record<LoopStopReason, string>> = {
  'tope-gasto': 'tope de gasto',
  'tope-ciclos': 'tope de ciclos',
  'tope-denegaciones': 'tope de denegaciones',
  'pool-agotado': 'pool agotado',
  'sin-avance': 'falta de avance'
}

export function observacionDeParada(
  reason: LoopStopReason,
  detalle: string | null
): SelfNoteDraft | null {
  if (reason === 'error') {
    const note = detalle
      ? `El loop autonomo se rompio: ${detalle}`
      : 'El loop autonomo se rompio sin mensaje'
    return { kind: 'bug', area: 'parada-del-loop', note }
  }
  const limite = LIMITES[reason]
  if (limite === undefined) return null
  const cifra = detalle ? `: ${detalle}` : ''
  return {
    kind: 'limitacion',
    area: 'parada-del-loop',
    note: `El loop autonomo paro por ${limite}${cifra}`
  }
}

/**
 * El standby, clasificado por su causa y SIN el texto crudo: el error del CLI
 * puede llevar rutas del cliente y cambia en cada reintento (uno por minuto
 * mientras el proveedor no vuelve), y una nota que baila siembra un
 * avistamiento por reintento. Con la clase fija, la misma caida es UN aviso.
 * Las clases calcan los grupos de `classifyFailure`.
 */
const CLASES: ReadonlyArray<readonly [RegExp, string]> = [
  [/credit|balance|insufficient|saldo|agotad|quota|cuota/i, 'credito o cuota'],
  [/rate.?limit|too many requests|429/i, 'limite de tasa'],
  [/overloaded|503|502|500|unavailable|no disponible/i, 'proveedor caido o sobrecargado'],
  [/network|ENOTFOUND|ECONNRESET|ETIMEDOUT|timeout|\bred\b/i, 'red o timeout'],
  [/en marcha|already running|in progress/i, 'otro proceso en marcha']
]

export function observacionDeStandby(error: string): SelfNoteDraft {
  const clase = CLASES.find(([re]) => re.test(error))?.[1] ?? 'sin clasificar'
  return {
    kind: 'limitacion',
    area: 'standby-del-loop',
    note: `El loop autonomo entro en STANDBY por un fallo transitorio del proveedor: ${clase}`
  }
}
