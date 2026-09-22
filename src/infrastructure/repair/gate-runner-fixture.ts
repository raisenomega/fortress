import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

/**
 * npm fake, sin mocks de child_process: decide por sus argumentos igual que el
 * real ("ci" o "run <script>") y apunta cada llamada en un fichero, para poder
 * comprobar CON QUE nombre de script se le llamo.
 */
export function fakeNpm(script = ':'): { bin: string; llamadas: string } {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-gate-'))
  const bin = join(dir, 'fake-npm')
  // El registro de llamadas se escribe en el CWD (el worktree), no aqui: el gate
  // corre dentro de la caja (ADR-092) y desde ahi este directorio no existe. Lo
  // unico que un comando del gate puede escribir es su proyecto — y eso es lo
  // que se mira.
  writeFileSync(bin, `#!/bin/sh\necho "$@" >> ./llamadas.txt\n${script}\nexit 0\n`)
  chmodSync(bin, 0o755)
  return { bin, llamadas: 'llamadas.txt' }
}

/** Un worktree de prueba que declara exactamente los scripts que se le pidan. */
export function repo(...scripts: readonly string[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-repo-'))
  const declarados = Object.fromEntries(scripts.map((name) => [name, 'true']))
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: declarados }))
  return dir
}

/** Un directorio sin package.json: ni siquiera dice que sabe verificar. */
export function repoVacio(): string {
  return mkdtempSync(join(tmpdir(), 'fcc-vacio-'))
}
