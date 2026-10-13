import { estaProbado } from '@domain/repair/evidencia-obsolescencia'
import { inferirDelFoco } from './inferir-del-foco'
import type { Analysis } from '@domain/repair/analysis'
import type { AppContext } from '../context'
import type { Project } from '@domain/project/project'
import type { Veredicto } from '@domain/repair/veredicto-del-analisis'

/** Desenlace de resolver el fichero de prueba: probar UNO, o conservar con MOTIVO
 *  visible (nunca el MITIGATED generico silencioso, P2). */
export type Resolucion = { readonly probar: string } | { readonly conservar: string }

const AJENO = 'obsoleto segun el agente, pero cito un fichero ajeno al arreglo'

/**
 * Que probar para la extincion, en el camino de VERIFY (no en extinguirSiObsoleto:
 * solo aqui hay base de turno; el Motor planifica antes del fix). `estaProbado` se
 * LLAMA, no se edita (byte-identico, firmado). ADR-087 enmienda, P1+P2.
 */
export async function ficheroAProbar(
  context: AppContext,
  project: Project,
  analysis: Analysis,
  veredicto: Veredicto
): Promise<Resolucion> {
  const ancla = analysis.target.file
  if (veredicto.verdict !== 'OBSOLETO') return { probar: ancla }
  const citado = analysis.evidencia?.file

  if (citado !== undefined && citado !== ancla) {
    // CITA EXPLICITA: puerta touched-por-el-foco (P1). Ajeno → conserva; la
    // inferencia NO rescata un `file` explicito equivocado.
    const desde = (await context.fileHistory.baseDelFoco(project.path, analysis.target.id)) ?? context.headSha(project.path) // prettier-ignore
    const tocado = desde !== null && (await context.fileHistory.tocadoPorElArreglo(project.path, citado, desde))
    return tocado ? { probar: citado } : { conservar: `${AJENO}: ${citado}` }
  }

  // FILE OMITIDO: el ancla es lo normal (cierra como hoy si prueba ahi). Si no
  // prueba y la forma es 'presente', infiere del foco (P2) en vez del ancla mudo.
  const anclaOk = estaProbado(analysis.evidencia, context.filesystemProbe.contenido(project.path, ancla)).probado
  if (anclaOk || analysis.evidencia?.forma !== 'presente') return { probar: ancla }
  return inferirDelFoco(context, project, analysis)
}
