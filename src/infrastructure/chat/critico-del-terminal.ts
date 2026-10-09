import { CLAUDE_BIN } from '../claude-code/claude-cli'
import { createGraphCritico } from '../repair/graph-critico'
import { grafoDelTurnoDe } from '../graph/grafo-del-turno'
import { getAppContext } from '../persistence/app-context'
import type { TribunalDeps } from '@application/chat/tribunal-con-critico'

/**
 * El critico del Terminal (ADR-096, Fase B): el mismo corredor, con el cwd
 * anclado al proyecto vivo. Gemelo de `omega-del-terminal`, y por la misma
 * razon — el adaptador solo decide DONDE corre, nunca QUE hace.
 */
export function criticoDelTerminal(projectId: string): TribunalDeps['critico'] {
  const proyecto = getAppContext().projects.findById(projectId)
  // Fail-closed (137): sin fila, el critico corre SIN confianza (solo fuentes user).
  return createGraphCritico(CLAUDE_BIN, projectId, proyecto?.trusted ?? false, undefined, grafoDelTurnoDe(proyecto?.path ?? null)) // prettier-ignore
}
