import { CLAUDE_BIN } from '../claude-code/claude-cli'
import { createGraphOmega } from '../repair/graph-omega'
import type { OmegaDelTurno } from '@application/chat/omega-del-turno'

/**
 * El revisor del Terminal (ADR-090, Fase A): el MISMO OMEGA del Motor, con el
 * cwd anclado al proyecto vivo en vez de a un worktree. No se le hace una
 * variante propia a proposito — dos revisores distintos juzgarian distinto, y
 * entonces «lo revisa OMEGA» dejaria de querer decir una sola cosa.
 */
export function omegaDelTerminal(projectId: string): OmegaDelTurno {
  return createGraphOmega(CLAUDE_BIN, projectId)
}
