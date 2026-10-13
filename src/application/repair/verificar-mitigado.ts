import type { DictamenDeVerificacion, QuienVerifica } from '@domain/repair/dictamen-de-verificacion'
import { notaDeVerificacion } from '@domain/repair/dictamen-de-verificacion'
import { elegirParaVerificar } from './elegir-para-verificar'
import { estudiar } from './estudiar-con-memoria'
import { extinguirSiObsoleto } from './extinguir-con-juicio'
import { ficheroAProbar } from './fichero-a-probar'
import { nowIso } from '@domain/shared/id'
import { conAgentRun, recordMotorRun } from './record-motor-run'
import { veredictoDelAnalisis } from '@domain/repair/veredicto-del-analisis'
import type { AppContext } from '../context'

/** Motivo del mitigado cuando el analista cito un fichero que el arreglo NO toco. */
const SIN_PRUEBA_AJENO = 'obsoleto segun el agente, pero cito un fichero ajeno al arreglo'

/**
 * El operador pide confirmar que su arreglo cerro el hallazgo (ADR-087).
 *
 * SIN PROPUESTA, y es decision de forma: `planRepair` abre una `Proposal` porque
 * va a proponer un fix; aqui no se propone nada, y una propuesta que nunca quiso
 * reparar miente sobre la intencion y ensucia la lista de lo pendiente de firmar.
 * Ninguna de las cuatro piezas la necesita (reciben Selection/projectId/Analysis).
 *
 * El rastro no se pierde: la corrida queda en `agent_runs` con su coste, las notas
 * van al backlog, y el desenlace a la propia fila (`extinct_reason`/`mitigated_note`).
 *
 * EL DESENLACE QUE JUSTIFICA ESTO: el hallazgo NO muere cuando la ausencia no se
 * prueba —protege al operador de su error, como el dia que dos CSP murieron por un
 * comentario—. Y si el analista dice que SIGUE, se retira el mitigado y vuelve.
 *
 * `quien` lo pide: el operador por defecto, o el Terminal al cerrar su turno
 * (ADR-088). Va a `extinguido_por` y al aviso, que nombran al autor real.
 */
export async function verificarMitigado(
  context: AppContext,
  projectId: string,
  findingId: string,
  quien: QuienVerifica = 'operador'
): Promise<DictamenDeVerificacion | null> {
  const project = context.projects.findById(projectId)
  if (project === null) return null
  const selection = elegirParaVerificar(context, projectId, findingId)
  if (selection === null) return null

  const crudo = await estudiar(context, project, selection)
  const result = conAgentRun(crudo, recordMotorRun(context, projectId, null, crudo.runMeta))
  // Lo que el analista noto de FORTRESS vale igual que en el otro camino: se
  // topo con el mismo limite mirando el mismo codigo.
  for (const nota of result.analysis.notes ?? []) {
    context.selfObservations.add({
      ...nota,
      sourceProject: project.name,
      projectPath: project.path
    })
  }

  const veredicto = veredictoDelAnalisis(result.analysis)
  // La puerta touched-by-fix (ADR-087 enm.): un fichero citado ajeno al arreglo
  // (`null`) no extingue; el ancla o una cita tocada por el fix, si.
  const fichero = await ficheroAProbar(context, project, result.analysis, veredicto)
  if (fichero !== null && extinguirSiObsoleto(context, project, result.analysis, veredicto, nowIso(), quien, fichero)) { // prettier-ignore
    return { desenlace: 'extinguido', razon: veredicto.reason }
  }
  if (fichero === null) context.findings.markMitigated(findingId, `${SIN_PRUEBA_AJENO}: ${result.analysis.evidencia?.file ?? ''}`, nowIso()) // prettier-ignore

  const desenlace = veredicto.verdict === 'OBSOLETO' ? 'sin_prueba' : 'sigue_vivo'
  const nota = notaDeVerificacion(desenlace, veredicto.reason, quien)
  // LA ASIMETRIA, de certeza contra duda. `sigue_vivo` es una AFIRMACION: el
  // analista leyo el fichero y el problema esta ahi, la marca del operador era
  // falsa y el hallazgo vuelve a la cola (si no, seguiria contando y bloqueando
  // el push mientras el motor no lo puede tocar). `sin_prueba` es DUDA: dijo
  // obsoleto y no lo probo, se conserva (ADR-065) y solo se anota el porque.
  if (desenlace === 'sigue_vivo') context.findings.devolverALaCola(findingId, nota)
  else context.findings.anotarVerificacion(findingId, nota)
  return { desenlace, razon: nota }
}
