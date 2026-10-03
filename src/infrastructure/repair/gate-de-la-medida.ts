import type { MedidaDelArbol } from '@domain/repair/asiento-de-la-medida'
import { GATE_COMMANDS } from '@domain/repair/gate-config'
import { resolveVerifyScript } from '@domain/settings/safe-commands'
import { readProjectScripts } from '../claude-code/project-scripts'
import { spawnCommand } from './spawn-command'

/** Una medida que no llego a dar verde, con lo que SI corrio dentro. */
export const falla = (detalle: string, comandos: readonly string[] = []): MedidaDelArbol => ({
  ok: false, comandos, detalle
}) // prettier-ignore

/**
 * El gate del motor sobre un arbol YA MONTADO en un worktree: los comandos de
 * verificacion del proyecto, sin `npm ci` —se mide donde las dependencias ya
 * estan instaladas, que es el sesenta por ciento del coste—. Salio de
 * `medir-arbol-integrado` al construir la sonda de la tanda (deuda #2): la
 * medida individual y la del conjunto corren EL MISMO gate, o sus verdes no
 * serian comparables.
 *
 * Si el proyecto no sabe correr NINGUNO de los comandos, no hay medida que dar
 * por buena: un verde sin comandos seria la mentira que este camino evita.
 */
export async function correrGateDeMedida(
  owner: string,
  bin: string,
  worktreePath: string
): Promise<MedidaDelArbol> {
  const scripts = readProjectScripts(worktreePath)
  const comandos: string[] = []

  for (const comando of GATE_COMMANDS) {
    const script = resolveVerifyScript(comando.key, scripts)
    if (script === null) continue
    const salido = await spawnCommand(bin, comando.key, ['run', script], worktreePath, comando.timeoutMs, owner) // prettier-ignore
    comandos.push(comando.key)
    if (salido.exitCode !== 0 || salido.timedOut) return falla('', comandos)
  }
  return comandos.length === 0 ? falla('el proyecto no sabe verificar nada') : { ok: true, comandos, detalle: '' } // prettier-ignore
}
