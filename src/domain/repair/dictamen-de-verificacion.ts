import type { ExtinguidoPor } from '../project/extinguido-por'

/**
 * En que queda una re-verificacion (ADR-087). Cerrado, y con TRES desenlaces
 * porque la realidad tiene tres, no dos.
 *
 *   extinguido    el analista probo la ausencia: el hallazgo murio, con juicio
 *   sin_prueba    dijo OBSOLETO pero su marcador no esta en el fichero
 *   sigue_vivo    dijo que el problema es REAL, o no se dejo leer
 *
 * Los dos ultimos dejan el hallazgo MITIGADO, y son distintos a proposito.
 * `sin_prueba` es «puede que lo arreglaras, pero no se puede comprobar»;
 * `sigue_vivo` es «el problema esta ahi». Colapsarlos en un «no se extinguio»
 * le quitaria al operador justo el dato que le dice si su fix sirvio.
 */
export const DESENLACES_DE_VERIFICACION = ['extinguido', 'sin_prueba', 'sigue_vivo'] as const

export type DesenlaceDeVerificacion = (typeof DESENLACES_DE_VERIFICACION)[number]

export interface DictamenDeVerificacion {
  readonly desenlace: DesenlaceDeVerificacion
  /** Lo que el operador lee en pantalla y lo que queda escrito en la fila. */
  readonly razon: string
}

/** Quien pide confirmar un arreglo: el operador sobre su fila (ADR-087) o el
 *  Terminal al conservar un turno que edito con el hallazgo en foco (ADR-088).
 *  La cola del motor no re-verifica mitigados, y por eso `agente` no esta. */
export type QuienVerifica = Exclude<ExtinguidoPor, 'agente'>

/** El aviso nombra al autor REAL. Escribir «a peticion del operador» en un
 *  cierre que disparo el Terminal le atribuiria al operador un acto que no hizo. */
const A_PETICION: Record<QuienVerifica, string> = {
  operador: 'verificado a peticion del operador',
  terminal: 'verificado al cerrar un turno del Terminal'
}

const AVISO: Record<Exclude<DesenlaceDeVerificacion, 'extinguido'>, string> = {
  sin_prueba:
    'el analista lo dio por obsoleto pero no pudo probarlo en el fichero, asi que el hallazgo ' +
    'NO se cierra',
  sigue_vivo: 'el analista dice que el problema SIGUE en el codigo. El arreglo no lo cerro'
}

/** La nota que se escribe en la fila que sigue mitigada. Lleva el detalle del
 *  analista detras del aviso: sin el, el operador sabe que fallo y no por que. */
export function notaDeVerificacion(
  desenlace: Exclude<DesenlaceDeVerificacion, 'extinguido'>,
  detalle: string,
  quien: QuienVerifica = 'operador'
): string {
  return `${A_PETICION[quien]}: ${AVISO[desenlace]} — ${detalle}`
}
