import type { DictamenDeVerificacion } from '@domain/repair/dictamen-de-verificacion'
import { notaDeVerificacion } from '@domain/repair/dictamen-de-verificacion'
import { elegirParaVerificar } from './elegir-para-verificar'
import { estudiar } from './estudiar-con-memoria'
import { extinguirSiObsoleto } from './extinguir-con-juicio'
import { nowIso } from '@domain/shared/id'
import { conAgentRun, recordMotorRun } from './record-motor-run'
import { veredictoDelAnalisis } from '@domain/repair/veredicto-del-analisis'
import type { AppContext } from '../context'

/**
 * El operador pide confirmar que su arreglo cerro el hallazgo (ADR-087).
 *
 * SIN PROPUESTA, y esa es la decision de forma. `planRepair` abre una `Proposal`
 * porque va camino de proponer un fix; aqui no se propone nada, y una propuesta
 * que nunca quiso reparar miente sobre la intencion y ensucia la lista donde el
 * operador mira lo que tiene pendiente de firmar. Se comprobo pieza por pieza
 * que ninguna de las cuatro la necesita: `estudiar` recibe la `Selection`,
 * `recordMotorRun` el `projectId`, y el veredicto y la extincion, el `Analysis`.
 *
 * El rastro no se pierde por eso: la corrida del agente queda en `agent_runs`
 * con su coste, lo que el analista noto de FORTRESS va al backlog, y el
 * desenlace queda escrito en la propia fila —en `extinct_reason` y
 * `extinguido_por` si murio, en `mitigated_note` si no—.
 *
 * EL DESENLACE QUE JUSTIFICA TODO ESTO es el segundo: si el analista no prueba
 * la ausencia, el hallazgo NO muere y el operador se entera de que su fix no
 * cerro el problema. Es el sistema protegiendole de su propio error, y es
 * exactamente lo que faltaba el dia que dos hallazgos de la CSP murieron porque
 * alguien anadio un comentario.
 */
export async function verificarMitigado(
  context: AppContext,
  projectId: string,
  findingId: string
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
  if (extinguirSiObsoleto(context, project, result.analysis, veredicto, nowIso(), 'operador')) {
    return { desenlace: 'extinguido', razon: veredicto.reason }
  }

  const desenlace = veredicto.verdict === 'OBSOLETO' ? 'sin_prueba' : 'sigue_vivo'
  const nota = notaDeVerificacion(desenlace, veredicto.reason)
  // `anotarMitigado` y no `markMitigated`: aquel exige venir de ACTIVE, y esta
  // fila lleva mitigada desde antes. Con el otro el aviso no se escribia y el
  // operador se quedaba creyendo que su fix valio.
  context.findings.anotarMitigado(findingId, nota)
  return { desenlace, razon: nota }
}
