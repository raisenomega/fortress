import type { AutoMergeCase } from './auto-merge-gather'

/**
 * El mensaje del merge es el unico asiento que queda FUERA de la base del
 * motor: vive en el repo del operador. Cita lo mismo que el Libro para que
 * quien llegue por `git log`, dentro de un ano y sin FORTRESS delante, pueda
 * reconstruir por que ese commit entro sin que nadie lo firmara.
 */
export function autoMergeCommitMessage(caso: AutoMergeCase): string {
  const { proposal, state, severity } = caso
  const lineas = state.insertions + state.deletions
  return [
    `merge: integracion automatica de ${proposal.id.slice(0, 8)} (${severity})`,
    '',
    `base: ${state.baseSha}`,
    `fix: ${state.commitSha}`,
    `rama: ${state.branch}`,
    `cambios: ${lineas} lineas en ${state.files.length} archivo(s)`,
    `archivos: ${state.files.join(', ')}`,
    `revisor: ${state.omega.veredicto_global} — ${state.omega.razon}`
  ].join('\n')
}
