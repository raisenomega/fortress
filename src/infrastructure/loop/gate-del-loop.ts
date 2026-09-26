import { esHastaGate, type LoopGateInput } from '@domain/loop/loop-gate'
import type { Project } from '@domain/project/project'
import { loopConfigured, type LoopBudget } from '@domain/settings/loop-budget'
import { isFortressRepo } from '../system/self-project'

/** La entrada del gate, de la que sale tambien el modo: una sola lectura del
 *  proyecto decide si puede correr y como, sin que las dos puedan discrepar. */
export function gateDe(project: Project, budget: LoopBudget): LoopGateInput {
  const selfRepo = isFortressRepo(project.path)
  // prettier-ignore
  return { trusted: project.trusted, selfRepo, configured: loopConfigured(budget), hastaGate: esHastaGate(selfRepo) }
}
