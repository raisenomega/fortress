import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Andamiaje de los tests de Sello 2a, sobre repos TEMPORALES. HOME aislado: ni
 * el mutante `--global` toca el `~/.gitconfig` real. Health Flow nunca se toca.
 */
export function homeAislado(): string | undefined {
  const previo = process.env.HOME
  process.env.HOME = mkdtempSync(join(tmpdir(), 'home2a-'))
  return previo
}

export function repoTemporal(conHistoria = false): string {
  const dir = mkdtempSync(join(tmpdir(), 'git2a-'))
  execFileSync('git', ['init'], { cwd: dir })
  if (conHistoria) {
    execFileSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@t.z', 'commit', '--allow-empty', '-m', 'x'], { cwd: dir }) // prettier-ignore
  }
  return dir
}

export function cfgDe(dir: string, clave: string, scope = '--local'): string {
  try {
    return execFileSync('git', ['config', scope, '--get', clave], { cwd: dir, encoding: 'utf8' }).trim() // prettier-ignore
  } catch {
    return ''
  }
}
