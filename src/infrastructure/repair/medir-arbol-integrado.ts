import type { MedidaDelArbol } from '@domain/repair/asiento-de-la-medida'
import { GATE_COMMANDS } from '@domain/repair/gate-config'
import { resolveVerifyScript } from '@domain/settings/safe-commands'
import { readProjectScripts } from '../claude-code/project-scripts'
import { git, lastLine } from './repair-git'
import { spawnCommand } from './spawn-command'

/**
 * Que ficheros ha tocado el destino desde la base de la propuesta. `null` no es
 * "ninguno": es que no se pudo saber —una base que git ya no encuentra, un repo
 * que no responde—, y quien lo reciba tiene que medir igual. Devolver la lista
 * vacia ahi diria "el destino no se movio" sobre algo que nadie llego a mirar.
 */
export async function ficherosDelDestino(
  projectPath: string,
  baseSha: string
): Promise<readonly string[] | null> {
  const { code, out } = await git(projectPath, ['diff', '--name-only', baseSha, 'HEAD'])
  return code === 0 ? out.split('\n').filter((linea) => linea.trim() !== '') : null
}

const falla = (detalle: string, comandos: readonly string[] = []): MedidaDelArbol => ({
  ok: false, comandos, detalle
}) // prettier-ignore

/**
 * El destino, mergeado DENTRO del worktree de la propuesta, y el gate del motor
 * corrido sobre ese arbol: el que resultara de integrar, medido antes de que el
 * arbol vivo se entere de nada.
 *
 * El worktree es el sitio y no un checkout nuevo porque ya tiene instaladas sus
 * dependencias: medir aqui cuesta los tres comandos, y en un worktree recien
 * hecho costaria ademas el `npm ci`, que en este repo es el sesenta por ciento
 * del gate. Un choque TEXTUAL al mergear tampoco se deja a medias: se aborta
 * —y el abort de un worktree es suyo, no del repositorio entero, que es lo que
 * hace seguro hacerlo aqui y no en el arbol vivo—.
 *
 * Si el proyecto no sabe correr NINGUNO de los tres, no hay medida que dar por
 * buena: un verde sin comandos seria la mentira que este camino existe para
 * evitar.
 */
export async function medirArbolIntegrado(
  owner: string,
  worktreePath: string,
  projectPath: string,
  bin = 'npm'
): Promise<MedidaDelArbol> {
  const head = await git(projectPath, ['rev-parse', 'HEAD'])
  if (head.code !== 0) return falla('no se pudo leer el destino')

  const mensaje = 'medida del arbol integrado'
  const merge = await git(worktreePath, ['merge', '--no-ff', '-m', mensaje, head.out.trim()])
  if (merge.code !== 0) {
    await git(worktreePath, ['merge', '--abort'])
    return falla(`choque textual con el destino — ${lastLine(merge.out)}`)
  }
  return correr(owner, bin, worktreePath)
}

async function correr(owner: string, bin: string, worktreePath: string): Promise<MedidaDelArbol> {
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
