import type { GateOutcome } from '@domain/repair/gate-result'
import type { OmegaVerdict } from '@domain/repair/omega-verdict'
import { MOTIVO_WORKTREE } from '@domain/repair/motivo-del-worktree'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import { collectGateOutcome } from './collect-gate-outcome'
import { numero, texto, ultimo } from './lectura-del-libro'

/**
 * Lo que hizo falta para llegar hasta el veredicto, reunido. Ningun campo es
 * opcional: o esta el expediente entero o no hay estado que devolver. Una
 * struct a medias invitaria a decidir con menos de lo que se miro.
 */
export interface PostOmegaState {
  readonly branch: string
  readonly baseSha: string
  readonly commitSha: string
  readonly files: readonly string[]
  readonly insertions: number
  readonly deletions: number
  readonly gate: GateOutcome
  readonly omega: OmegaVerdict
}

/**
 * Reune desde el libro todo lo que una propuesta dejo al llegar al veredicto:
 * la rama y el ancla del worktree, el commit del fix con su tamano, el juicio
 * mecanico y el semantico.
 *
 * Se LEE, no se reconstruye desde convencion: el nombre de la rama esta escrito
 * donde el motor lo creo, y recomponerlo desde el patron fallaria en silencio
 * el dia que el patron cambie. Devuelve null si falta cualquier pieza — un
 * expediente incompleto no es un expediente.
 */
export function collectPostOmegaState(events: readonly ProposalEvent[]): PostOmegaState | null {
  const decision = ultimo(events, 'GENERATE', 'DECISION', MOTIVO_WORKTREE) as Record<string, unknown> | undefined // prettier-ignore
  const salida = ultimo(events, 'GENERATE', 'TRANSITION') as Record<string, unknown> | undefined
  const juicio = ultimo(events, 'OMEGA', 'TRANSITION') as { verdict?: OmegaVerdict } | undefined
  if (decision === undefined || salida === undefined) return null

  const branch = texto(decision.branch)
  const baseSha = texto(decision.baseSha)
  const commitSha = texto(salida.commitSha)
  const insertions = numero(salida.insertions)
  const deletions = numero(salida.deletions)
  const files = Array.isArray(salida.files) ? (salida.files as string[]) : null
  const gate = collectGateOutcome(events)
  const omega = juicio?.verdict

  if (branch === null || baseSha === null || commitSha === null) return null
  if (insertions === null || deletions === null || files === null) return null
  if (gate === null || omega === undefined) return null

  return { branch, baseSha, commitSha, files, insertions, deletions, gate, omega }
}
