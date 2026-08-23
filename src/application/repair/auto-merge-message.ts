import type { AutoMergeCase } from './auto-merge-gather'
import type { ViaDeIntegracion } from './auto-merge-types'

/** Lo que el asunto dice de cada via. La palabra importa: es lo que vera quien
 *  lea el historial sin la app delante. */
const ASUNTO: Readonly<Record<ViaDeIntegracion, string>> = {
  automatica: 'integracion automatica',
  firmada: 'integracion firmada'
}

/**
 * El mensaje del merge es el unico asiento que queda FUERA de la base del
 * motor: vive en el repo del operador. Cita lo mismo que el Libro para que
 * quien llegue por `git log`, dentro de un ano y sin FORTRESS delante, pueda
 * reconstruir por que ese commit entro y QUIEN lo dejo entrar.
 *
 * Esa segunda mitad falto un tiempo. El asunto decia "integracion automatica"
 * en las dos vias, asi que los merges que el operador habia firmado quedaban
 * escritos como si los hubiera decidido la maquina. En el historial de un
 * sistema cuya garantia central es "nada entra sin firma", esa linea era la
 * unica prueba, y decia lo contrario de lo que paso.
 */
export function autoMergeCommitMessage(caso: AutoMergeCase, via: ViaDeIntegracion): string {
  const { proposal, state, severity } = caso
  const lineas = state.insertions + state.deletions
  return [
    `merge: ${ASUNTO[via]} de ${proposal.id.slice(0, 8)} (${severity})`,
    '',
    `base: ${state.baseSha}`,
    `fix: ${state.commitSha}`,
    `rama: ${state.branch}`,
    `cambios: ${lineas} lineas en ${state.files.length} archivo(s)`,
    `archivos: ${state.files.join(', ')}`,
    `revisor: ${state.omega.veredicto_global} — ${state.omega.razon}`
  ].join('\n')
}
