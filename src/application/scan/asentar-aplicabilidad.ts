import type { VeredictoAplicabilidad } from '@domain/scan/veredicto-de-aplicabilidad'
import { NOMBRE_MODULO } from '@domain/scan/modulo-auditoria'
import { esUsable } from '@domain/scan/veredicto-de-aplicabilidad'
import type { AppContext } from '../context'

const CLASIFICADOR = 'scope-classifier'

/**
 * Deja en el Libro que se decidio sobre un modulo y con que prueba (ADR-083).
 *
 * Con clase PROPIA (`aplicabilidad`) y no como `nota`: la pregunta que un
 * informe tiene que poder contestar es «que se decidio no auditar, y con que
 * evidencia», y responderla buscando cadenas en los resumenes es justo lo que
 * ese campo existe para evitar.
 *
 * Se asienta el veredicto ENTERO, tambien el que no se pudo usar: un juicio sin
 * cita comprobable no mueve el manifiesto, pero que el agente lo intentara y no
 * trajera prueba es un hecho, y el Libro es donde los hechos no se pierden.
 *
 * Va como `info`. Decidir que M8 aplica no acusa a nadie, y los dos veredictos
 * acusatorios —`discrepancia` y `veto`— cuentan contra la veracidad de un
 * agente (ADR-074). Mismo criterio que el termometro de vocabulario.
 *
 * Mejor esfuerzo: el escaneo sigue aunque el asiento falle.
 */
export function asentarAplicabilidad(
  context: AppContext,
  projectId: string,
  veredicto: VeredictoAplicabilidad
): void {
  const usable = esUsable(veredicto) ? '' : ' (sin cita comprobable: no se usa)'
  try {
    context.omegaLog.append({
      projectId,
      agentId: CLASIFICADOR,
      kind: 'aplicabilidad',
      verdict: 'info',
      summary: `${veredicto.modulo} ${NOMBRE_MODULO[veredicto.modulo]}: aplica=${veredicto.aplica}${usable}`, // prettier-ignore
      evidence: veredicto.porque
    })
  } catch (error) {
    console.error('[scan] no se pudo asentar la aplicabilidad', projectId, error)
  }
}
