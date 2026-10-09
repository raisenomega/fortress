import { CLAUDE_BIN } from '../claude-code/claude-cli'
import { createGraphOmega } from '../repair/graph-omega'
import { grafoDelTurnoDe } from '../graph/grafo-del-turno'
import { getAppContext } from '../persistence/app-context'
import type { OmegaDelTurno } from '@application/chat/omega-del-turno'

/**
 * El revisor del Terminal (ADR-090, Fase A): el MISMO OMEGA del Motor, con el
 * cwd anclado al proyecto vivo en vez de a un worktree. No se le hace una
 * variante propia a proposito — dos revisores distintos juzgarian distinto, y
 * entonces «lo revisa OMEGA» dejaria de querer decir una sola cosa.
 */
export function omegaDelTerminal(projectId: string): OmegaDelTurno {
  const proyecto = getAppContext().projects.findById(projectId)
  // Fail-closed (137): sin fila, el juez corre SIN confianza (solo fuentes user).
  return createGraphOmega(CLAUDE_BIN, projectId, proyecto?.trusted ?? false, undefined, grafoDelTurnoDe(proyecto?.path ?? null)) // prettier-ignore
}
