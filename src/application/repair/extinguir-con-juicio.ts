import type { Veredicto } from '@domain/repair/veredicto-del-analisis'
import type { AppContext } from '../context'

/**
 * La UNICA via por la que un hallazgo muere: un agente lo miro y dictamino que
 * el problema ya no esta.
 *
 * Antes moria en el camino del escaneo, por no ser nombrado. Eso no era un
 * juicio —el escaner es un LLM y su silencio no afirma nada— y llego a cerrar
 * hallazgos de seguridad cuyo defecto seguia en el codigo. Ahora cerrar exige
 * que alguien lo haya MIRADO, y el motivo queda escrito en la fila.
 *
 * Solo con veredicto OBSOLETO: REAL sigue vivo para repararse, e ILEGIBLE ni
 * siquiera es una opinion —es que no se pudo leer la que hubo—, asi que un
 * hallazgo no puede morir por un JSON truncado. Ver `veredictoDelAnalisis`.
 */
export function extinguirSiObsoleto(
  context: AppContext,
  findingId: string,
  veredicto: Veredicto,
  at: string
): void {
  if (veredicto.verdict !== 'OBSOLETO') return
  context.findings.markExtinct([findingId], at, 'juicio_obsoleto')
}
