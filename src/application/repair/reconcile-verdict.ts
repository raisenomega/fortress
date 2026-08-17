import { canTransition, type ProposalState } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { RECLAIM_REASONS } from '@domain/repair/reclaim-reasons'

export interface Verdict {
  /** Estados a recorrer, en orden. Cada salto se valida antes de escribirse. */
  readonly path: readonly ProposalState[]
  readonly reason: string
}

/** El commit que dejo la fase GENERATE, si llego a producirse. */
export function commitOf(events: readonly ProposalEvent[]): string | null {
  for (const event of events) {
    if (event.evidenceJson === undefined) continue
    try {
      const sha: unknown = (JSON.parse(event.evidenceJson) as { commitSha?: unknown }).commitSha
      if (typeof sha === 'string' && sha !== '') return sha
    } catch {
      continue
    }
  }
  return null
}

/**
 * Camino legal hasta MERGEADO, DERIVADO de la tabla de transiciones: nunca se
 * salta un estado. Solo APROBADO llega directo; OMEGA pasa por el. Desde antes
 * no hay camino honesto — llegar exigiria fabricar un gate y un veredicto.
 */
export function mergePath(from: ProposalState): readonly ProposalState[] | null {
  if (canTransition(from, 'MERGEADO')) return ['MERGEADO']
  if (canTransition(from, 'APROBADO') && canTransition('APROBADO', 'MERGEADO')) {
    return ['APROBADO', 'MERGEADO']
  }
  return null
}

/**
 * Que hacer con una propuesta viva sin worktree. Puro: la consulta a git entra
 * como funcion. Sesgo seguro en cada rama — sin prueba de merge se CADUCA,
 * nunca se fabrica un MERGEADO.
 *
 * Sin commit en el libro no falta ningun worktree —nace en GENERATE, a la vez
 * que el commit— y ahi manda el estado. ANALIZADO espera a que el operador
 * pulse Generar, y puede esperar dias: caducarlo seria matar trabajo en curso,
 * asi que se devuelve null. ELEGIDO no espera a nadie: su analisis es sincrono
 * y ningun boton lo avanza, asi que sobrevivir a un arranque solo puede
 * significar que murio a medias. Y al arrancar nada esta en vuelo: no hay duda
 * que conceder.
 */
export function decideOrphan(
  state: ProposalState,
  commitSha: string | null,
  repoPath: string | null,
  isMerged: (repoPath: string, commitSha: string) => boolean
): Verdict | null {
  const caducar = (reason: string): Verdict => ({ path: ['CADUCADO'], reason })
  if (commitSha === null) {
    return state === 'ELEGIDO' ? caducar(RECLAIM_REASONS.ANALISIS_INTERRUMPIDO) : null
  }
  if (repoPath === null) return caducar(RECLAIM_REASONS.PROYECTO_AUSENTE)
  if (!isMerged(repoPath, commitSha)) return caducar(RECLAIM_REASONS.WORKTREE_AUSENTE)
  const path = mergePath(state)
  return path === null
    ? caducar(RECLAIM_REASONS.WORKTREE_AUSENTE)
    : { path, reason: RECLAIM_REASONS.MERGE_DETECTADO }
}
