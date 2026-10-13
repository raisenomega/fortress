import type { Analysis } from '@domain/repair/analysis'
import type { Veredicto } from '@domain/repair/veredicto-del-analisis'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'

/**
 * Que fichero probar para la extincion, y la PUERTA touched-by-fix (ADR-087 enm.).
 *
 * Vive en el camino de VERIFY —no en `extinguirSiObsoleto`— porque solo aqui hay
 * base de turno: tras `conservar()` HEAD = inicio del turno, y el analista pudo
 * citar en `evidencia.file` el fichero del arreglo (un append-only cierra en OTRA
 * migracion, no en la linea vieja del ancla). El Motor planifica ANTES de que
 * exista el fix, asi que no cita ni pasa por aqui: conserva su conducta.
 *
 * Devuelve el ANCLA si no hay cita util o el veredicto no es OBSOLETO; la CITA si
 * el arreglo del turno la toco (git diff desde el sha del turno); `null` si cito
 * un fichero AJENO que el fix no toco → no cierra, se conserva (ADR-065).
 */
export async function ficheroAProbar(
  context: AppContext,
  project: Project,
  analysis: Analysis,
  veredicto: Veredicto
): Promise<string | null> {
  const ancla = analysis.target.file
  const citado = analysis.evidencia?.file
  if (veredicto.verdict !== 'OBSOLETO' || citado === undefined || citado === ancla) return ancla

  const desde = context.headSha(project.path)
  const tocado = desde !== null && (await context.fileHistory.tocadoPorElArreglo(project.path, citado, desde))
  return tocado ? citado : null
}
