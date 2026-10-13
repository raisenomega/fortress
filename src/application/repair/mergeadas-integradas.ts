import type { Proposal } from '@domain/repair/proposal'
import type { AppContext } from '../context'
import { commitOf } from './reconcile-verdict'

/**
 * De las propuestas de un hallazgo, cuantas confirma GIT que se integraron: su
 * commit de fix (el de GENERATE) es ancestro de HEAD. El merge del motor es
 * `--no-ff`, asi que ese commit queda como ancestro del destino y `esAncestro`
 * lo ve; un MERGEADO por estado cuyo commit git NO ve —rama borrada, merge que
 * no aterrizo (5214cc9 era huerfano)— NO cuenta. Es la git-verdad, no el estado.
 *
 * Sesgo seguro, el mismo de `isAncestor` y `decideOrphan`: sin commit o sin
 * prueba, no cuenta. Antes callar un integrado real que fabricar uno ausente.
 */
export async function mergeadasIntegradas(
  ctx: AppContext,
  projectPath: string,
  suyas: readonly Proposal[]
): Promise<number> {
  let integradas = 0
  for (const p of suyas) {
    if (p.state !== 'MERGEADO') continue
    const commit = commitOf(await ctx.eventLog.list(p.id))
    if (commit !== null && ctx.esAncestro(projectPath, commit)) integradas += 1
  }
  return integradas
}
