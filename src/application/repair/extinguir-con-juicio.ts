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
 * Antes moria en el escaneo, por no ser nombrado. Eso no era un juicio —el
 * escaner es un LLM y su silencio no afirma nada— y cerro hallazgos de seguridad
 * cuyo defecto seguia en el codigo. Se cambio por el juicio de un agente que
 * mira el archivo; pero entraba SOLO, en el mismo turno, sin gate, revisor ni
 * firma, mientras integrar un fix exige los tres. Un OBSOLETO equivocado cerro
 * un hallazgo que luego recibio un fix de verdad, y otros dos la CARENCIA que
 * denunciaban dejando el agujero en pie.
 *
 * La red no es creerle mejor: es COMPROBAR. El analisis trae un marcador literal
 * y FORTRESS lo busca en el fichero de hoy. Si cuadra, se extingue; si no, o no
 * hay marcador, NO muere: pasa a MITIGATED (sigue en el tablero, fuera de la cola
 * del motor, con la razon escrita) hasta que el operador lo mire. Duda → conserva.
 *
 * Solo con veredicto OBSOLETO: REAL sigue vivo para repararse, e ILEGIBLE ni
 * siquiera es una opinion. Ver `veredictoDelAnalisis`.
 *
 * El `target` lo paso ESTE proceso a `study()`, no lo elige el modelo
 * (`toAnalysis` lo copia): de ahi sale el hallazgo que se cierra. El fichero del
 * marcador es ese ancla por defecto; `evidencia.file` puede moverlo (ADR-087 enm.).
 *
 * `extinguidoPor` dice QUIEN lo pidio: la cola del motor, el operador sobre esa
 * fila (ADR-087) o el Terminal al conservar un turno con ella en foco (ADR-088).
 * El juicio es el mismo —un agente miro el fichero— y por eso el motivo no
 * cambia; lo que cambia es de quien salio la pregunta.
 *
 * DEVUELVE si extinguio: la re-verificacion lo necesita para contarle al operador
 * por que no cerro, sin repetir la comprobacion del marcador. El camino de
 * reparacion no lo mira.
 */
export function extinguirSiObsoleto(
  context: AppContext,
  project: Project,
  analysis: Analysis,
  veredicto: Veredicto,
  at: string,
  extinguidoPor: ExtinguidoPor = 'agente',
  ficheroDePrueba?: string
): boolean {
  if (veredicto.verdict !== 'OBSOLETO') return false

  // `ficheroDePrueba` lo resuelve el camino de VERIFY (verificarMitigado, con la
  // puerta touched-by-fix): aqui solo se LEE el que toque. Ausente = el ancla =
  // hoy. SYNC a proposito: el Motor (plan-repair/retry) planifica antes de que
  // exista el fix, no cita otro fichero, y no debe pagar un await. Ver ADR-087 enm.
  const { id, file: ancla } = analysis.target
  const fichero = ficheroDePrueba ?? ancla
  const prueba = estaProbado(analysis.evidencia, context.filesystemProbe.contenido(project.path, fichero))
  if (prueba.probado) {
    context.findings.markExtinct([id], at, 'juicio_obsoleto', extinguidoPor)
    return true
  }
  context.findings.markMitigated(id, `${SIN_PRUEBA}: ${prueba.motivo} en ${fichero}`, at)
  return false
}
