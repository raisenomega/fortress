import { execFileSync } from 'child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

/**
 * Un repo git de verdad con los ficheros que se le digan. Contra un repo real y
 * no contra un mock de `git ls-files`: lo que se prueba aqui es justo que la
 * enumeracion y sus filtros se comportan con git de por medio.
 */
export function repoCon(ficheros: Readonly<Record<string, string>>): string {
  const repo = mkdtempSync(join(tmpdir(), 'senales-'))
  const git = (...args: string[]): void =>
    void execFileSync('git', args, { cwd: repo, stdio: 'ignore' })

  git('init', '-q')
  for (const [ruta, texto] of Object.entries(ficheros)) {
    const destino = join(repo, ruta)
    mkdirSync(join(destino, '..'), { recursive: true })
    writeFileSync(destino, texto)
  }
  git('add', '-A')
  git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'base')
  return repo
}
