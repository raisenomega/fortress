import { ficherosEnComun, tocaDependencias } from '@domain/repair/arbol-que-se-movio'
import { asientoRojo, asientoVerde, SIN_MEDIR } from '@domain/repair/asiento-de-la-medida'
import type { MergeApplyOutcome } from '@domain/repair/merge-applier'
import type { AutoMergeCase } from './auto-merge-gather'
import { autoMergeCommitMessage } from './auto-merge-message'
import type { AutoMergeDeps, ViaDeIntegracion } from './auto-merge-types'

export type Integracion =
  | { readonly ok: true; readonly mergeCommitSha: string; readonly asiento: string }
  | { readonly ok: false; readonly reason: string; readonly detalle: string }

/** La salida de git, acotada: el asiento tiene que caber en una pantalla.
 *  NINGUN fallo se asienta ya sin su motivo —el de la rama destino se asentaba
 *  con la etiqueta sola, y por eso la primera firma quedo sin diagnostico. */
function detalleDe(outcome: Exclude<MergeApplyOutcome, { ok: true }>): string {
  return `${outcome.kind} — ${outcome.gitOutput.slice(0, 400)}`
}

/**
 * Medir el arbol que RESULTARA antes de tocar el vivo, y solo cuando el destino
 * se movio sobre ficheros del fix. Devuelve el asiento cuando se puede seguir.
 *
 * Se mide ANTES a proposito. Integrar y comprobar despues obligaria a deshacer
 * un merge ya asentado sobre el arbol de trabajo del operador, con la misma
 * forma ciega que el `git merge --abort` que costo la Familia E —una orden del
 * repositorio entero, que no sabe quien mas esta trabajando— y con una ventana
 * de minutos en vez de milisegundos. Aqui no hay nada que deshacer: si el arbol
 * integrado no pasa, el vivo no se llego a tocar.
 */
async function antesDeIntegrar(
  deps: AutoMergeDeps,
  caso: AutoMergeCase
): Promise<{ ok: true; asiento: string } | Integracion> {
  const destino = await deps.ficherosDelDestino(caso.project.path, caso.proposal.baseSha)
  // La duda cuenta contra la integracion, nunca a su favor —la misma regla con
  // la que el gate decide si un rojo era heredado—: si no se pudo saber que
  // toco el destino, se mide todo el fix en vez de darlo por no movido.
  const comunes = destino === null ? caso.state.files : ficherosEnComun(caso.state.files, destino)
  if (comunes.length === 0) return { ok: true, asiento: SIN_MEDIR }

  if (destino !== null && tocaDependencias(destino)) {
    const detalle = 'el destino cambio las dependencias y el gate del worktree ya no las representa'
    return { ok: false, reason: 'arbol-integrado-sin-medir', detalle }
  }

  const medida = await deps.medirArbolIntegrado(caso.proposal.id, caso.project.path)
  if (!medida.ok) return { ok: false, reason: 'arbol-integrado-rojo', detalle: asientoRojo(medida) }
  return { ok: true, asiento: asientoVerde(medida, comunes) }
}

/** El merge al arbol vivo, con la medida del arbol integrado por delante. */
export async function integrarMidiendoElArbol(
  deps: AutoMergeDeps,
  caso: AutoMergeCase,
  via: ViaDeIntegracion
): Promise<Integracion> {
  const medido = await antesDeIntegrar(deps, caso)
  if (!medido.ok) return medido

  const outcome = await deps.mergeApplier.apply({
    projectPath: caso.project.path,
    sourceBranch: caso.state.branch,
    commitMessage: autoMergeCommitMessage(caso, via)
  })
  return outcome.ok
    ? { ok: true, mergeCommitSha: outcome.mergeCommitSha, asiento: medido.asiento }
    : { ok: false, reason: `merge-failed-${outcome.kind}`, detalle: detalleDe(outcome) }
}
