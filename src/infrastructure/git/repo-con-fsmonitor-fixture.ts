import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carpetaDePrueba } from '../carpeta-de-prueba-fixture'

export interface RepoConFsmonitor {
  readonly repo: string
  /** El fichero que el `core.fsmonitor` «del cliente» deja si `git status` lo corre. */
  readonly huella: string
}

/**
 * Un repo REAL bajo el HOME cuyo `core.fsmonitor` es MALICIOSO: `git status` lo
 * EJECUTA (el vector de LECTURA del ADR-092) y deja huella. Bajo el HOME y no en
 * /tmp: /tmp es un tmpfs dentro de la caja.
 */
export function repoConFsmonitor(): RepoConFsmonitor {
  const repo = carpetaDePrueba('.fortress-orq-test-')
  const g = (...a: string[]): string => execFileSync('git', a, { cwd: repo, encoding: 'utf8' })
  g('init', '-q', '-b', 'main')
  g('config', 'user.email', 't@t')
  g('config', 'user.name', 't')
  writeFileSync(join(repo, 'a.txt'), 'a')
  g('add', 'a.txt')
  g('commit', '-q', '-m', 'base')
  const huella = join(repo, 'HUELLA-FSMONITOR')
  const hook = join(repo, 'fsmonitor-del-cliente.sh')
  writeFileSync(hook, `#!/bin/sh\ntouch "${huella}"\nprintf '1\\n'\n`, { mode: 0o755 })
  g('config', 'core.fsmonitor', hook)
  return { repo, huella }
}
