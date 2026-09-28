import type { SelfNoteDraft } from '../system/self-observation'
import type { LoopStopReason } from './loop-decision'

/**
 * Lo que FORTRESS aprende cuando su loop autonomo se para o espera (ROADMAP #5,
 * sub-pieza 4). Hermana de `observacionDeBarrera`, y con la misma doctrina:
 *
 * SALE DEL DATO, no de la prosa. El motivo es un vocabulario cerrado y la cifra
 * ya se compone en `detalleDeParada`; nadie le pregunta al modelo. Un TOPE es
 * FORTRESS topandose con su propio techo: `limitacion`. Romperse es un `bug`.
 * Parar a mano y terminar resuelto no son limites: no hay nada que observar, y
 * observarlos inflaria el backlog con exitos.
 *
 * La rama del ERROR llevaba el `message` CRUDO, y era la unica del sistema
 * nervioso que lo hacia: bailaba en cada reintento, no tenia tope y colaba datos
 * del cliente que el cerco no alcanza. Ahora recibe la CLASE ya derivada
 * (`claseDelFallo`) y el mensaje NO llega hasta aqui — ni por descuido, porque el
 * parametro del detalle no se lee en esa rama.
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
  detalle: string | null,
  clase: string | null
): SelfNoteDraft | null {
  if (reason === 'error') {
    const note = clase
      ? `El loop autonomo se rompio: ${clase}`
      : 'El loop autonomo se rompio sin clase reconocible'
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
