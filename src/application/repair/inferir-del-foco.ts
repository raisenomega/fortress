import type { Analysis } from '@domain/repair/analysis'
import type { AppContext } from '../context'
import type { Project } from '@domain/project/project'
import type { Resolucion } from './fichero-a-probar'

/**
 * Inferencia determinista (P2): el analista OMITIO `evidencia.file` y el marcador
 * 'presente' no esta en el ancla. Se busca en las ADICIONES del set del foco
 * —lo que NACIO con el arreglo—, no mera presencia, para no cerrar por un marcador
 * que ya estaba. Quita la dependencia de que el LLM rellene el campo, y hace
 * VISIBLE el miss: nunca cae al ancla en silencio.
 *
 *   UNO    → ese fichero (verificarMitigado lo prueba y cierra).
 *   NINGUNO → conserva: el marcador no nacio con el arreglo (no se puede probar).
 *   VARIOS  → conserva: ubicacion ambigua (no se adivina cual).
 */
export async function inferirDelFoco(context: AppContext, project: Project, analysis: Analysis): Promise<Resolucion> {
  const marcador = analysis.evidencia?.marcador ?? ''
  const candidatos = await context.fileHistory.ficherosConMarcadorNacido(project.path, analysis.target.id, marcador)
  const uno = candidatos[0]
  if (candidatos.length === 1 && uno !== undefined) return { probar: uno }
  if (candidatos.length === 0) return { conservar: 'reclamacion incompleta: el marcador no nacio con el arreglo' }
  return { conservar: 'reclamacion incompleta: ubicacion ambigua del marcador' }
}
