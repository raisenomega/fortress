import type { Analysis } from '@domain/repair/analysis'
import type { ExtinguidoPor } from '@domain/project/extinguido-por'
import { estaProbado } from '@domain/repair/evidencia-obsolescencia'
import type { Project } from '@domain/project/project'
import type { Veredicto } from '@domain/repair/veredicto-del-analisis'
import type { AppContext } from '../context'

/** El prefijo que dice QUIEN lo declaro. La marca de mitigado nacio para el
 *  operador; que la escriba un agente tiene que verse en la propia nota. */
const SIN_PRUEBA = 'obsoleto segun el agente, sin prueba comprobable'

/**
 * La UNICA via por la que un hallazgo muere, y ahora con red.
 *
 * Antes moria en el camino del escaneo, por no ser nombrado. Eso no era un
 * juicio —el escaner es un LLM y su silencio no afirma nada— y llego a cerrar
 * hallazgos de seguridad cuyo defecto seguia en el codigo. Se cambio por el
 * juicio de un agente, que mira el archivo; pero el juicio entraba SOLO, en el
 * mismo turno que lo emitia, sin gate, sin revisor y sin firma, mientras
 * integrar un fix exige los tres. Dos actos igual de irreversibles y uno sin
 * red: un OBSOLETO equivocado cerro un hallazgo que dos horas despues recibio
 * un fix de verdad, y otros dos cerraron la CARENCIA que denunciaban dejando el
 * agujero en pie.
 *
 * La red no es creerle mejor: es COMPROBAR. El analisis trae un marcador
 * literal y FORTRESS lo busca en el fichero de hoy. Si cuadra, se extingue. Si
 * no cuadra, o no hay marcador, el hallazgo NO muere: pasa a MITIGATED, que ya
 * existia y hace justo esto —sigue vivo, sigue contando en el tablero, sale de
 * la cola automatica del motor y lleva escrita la razon— hasta que el operador
 * lo mire. Ante la duda se conserva, nunca se borra.
 *
 * Solo con veredicto OBSOLETO: REAL sigue vivo para repararse, e ILEGIBLE ni
 * siquiera es una opinion. Ver `veredictoDelAnalisis`.
 *
 * El `target` del analisis es el candidato que ESTE proceso le paso a `study()`,
 * no algo que el modelo elija: `toAnalysis` lo copia del parametro. Por eso el
 * fichero que se lee y el hallazgo que se cierra salen de ahi.
 *
 * `extinguidoPor` dice QUIEN lo pidio: la cola del motor o el operador sobre esa
 * fila (ADR-087). El juicio es el mismo —un agente miro el fichero— y por eso el
 * motivo no cambia; lo que cambia es de quien salio la pregunta.
 *
 * DEVUELVE si extinguio. El camino de reparacion no lo mira —siga vivo o no, ya
 * hizo lo suyo—, pero la re-verificacion SI: cuando no extingue tiene que
 * contarle al operador por que, y sin este `boolean` tendria que repetir la
 * comprobacion del marcador para averiguarlo.
 */
export function extinguirSiObsoleto(
  context: AppContext,
  project: Project,
  analysis: Analysis,
  veredicto: Veredicto,
  at: string,
  extinguidoPor: ExtinguidoPor = 'agente'
): boolean {
  if (veredicto.verdict !== 'OBSOLETO') return false

  const { id, file } = analysis.target
  const contenido = context.filesystemProbe.contenido(project.path, file)
  const prueba = estaProbado(analysis.evidencia, contenido)

  if (prueba.probado) {
    context.findings.markExtinct([id], at, 'juicio_obsoleto', extinguidoPor)
    return true
  }
  context.findings.markMitigated(id, `${SIN_PRUEBA}: ${prueba.motivo} en ${file}`, at)
  return false
}
