import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carpetaDePrueba } from '../carpeta-de-prueba-fixture'

export interface RepoConHook {
  readonly repo: string
  /** El fichero que el hook del «cliente» deja si llega a correr. */
  readonly huella: string
}

/** Un repo REAL bajo el HOME con un hook del «cliente» que deja huella si corre.
 *  Bajo el HOME y no en /tmp: /tmp es un tmpfs dentro de la caja. */
export function repoConHook(hook: string): RepoConHook {
  const repo = carpetaDePrueba('.fortress-hooks-test-')
  const g = (...a: string[]): string => execFileSync('git', a, { cwd: repo, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }) // prettier-ignore
  g('init', '-q', '-b', 'main')
  g('config', 'user.email', 't@t')
  g('config', 'user.name', 't')
  writeFileSync(join(repo, 'a.txt'), 'a')
  g('add', 'a.txt')
  g('commit', '-q', '-m', 'base')
  const huella = join(repo, 'HUELLA-DEL-HOOK')
  mkdirSync(join(repo, '.git', 'hooks'), { recursive: true })
  writeFileSync(join(repo, '.git', 'hooks', hook), `#!/bin/sh\ntouch "${huella}"\n`, {
    mode: 0o755
  })
  return { repo, huella }
}

/** Un remoto bare al lado, para que `git push` tenga a donde ir sin red. */
export function conRemoto(repo: string): void {
  const remoto = carpetaDePrueba('.fortress-hooks-test-')
  execFileSync('git', ['init', '--bare', '-q', remoto])
  const g = (...a: string[]): void => {
    execFileSync('git', a, { cwd: repo })
  }
  g('remote', 'add', 'origin', remoto)
  g('config', 'branch.main.remote', 'origin')
  g('config', 'branch.main.merge', 'refs/heads/main')
}
