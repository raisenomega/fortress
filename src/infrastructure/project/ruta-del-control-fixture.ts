import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carpetaDePrueba } from '../carpeta-de-prueba-fixture'

export const MARCADOR = 'FrenoDeConfianza()' // control real: en control.ts Y en el decoy
export const MARCADOR_LLAMADOR = 'EnvueltoSeguro(' // cobaya 1: el control importa al ancla
export const MARCADOR_HUERFANO = 'Aislado()' // conectado a nada: el diente

/**
 * Un repo REAL que reproduce las dos formas de cobaya + el decoy + el huerfano:
 *   - `ancla → medio → control` (2 saltos): cobaya 2 (5075c498).
 *   - `llamador → ancla`: cobaya 1 (6f0683f4, el control envuelve al ancla).
 *   - `decoy`: MISMO marcador que `control`, NO conectado al ancla (install-graph).
 *   - `huerfano`: marcador propio, conectado a nada.
 *   - `control.test.ts`: lleva el marcador pero el grep de HEAD lo excluye.
 */
export function repoDeRuta(): string {
  const repo = carpetaDePrueba('.fortress-ruta-')
  const g = (...a: string[]): string =>
    execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...a], { cwd: repo, encoding: 'utf8' })
  mkdirSync(join(repo, 'src'))
  const f = (n: string, body: string): void => writeFileSync(join(repo, 'src', n), body)
  f('ancla.ts', "import { x } from './medio'\nexport const a = x\n")
  f('medio.ts', "import { c } from './control'\nexport const x = c\n")
  f('control.ts', `export const c = ${MARCADOR}\n`)
  f('decoy.ts', `export const d = ${MARCADOR}\n`)
  f('llamador.ts', `import { a } from './ancla'\nexport const w = ${MARCADOR_LLAMADOR}a)\n`)
  f('huerfano.ts', `export const h = ${MARCADOR_HUERFANO}\n`)
  f('control.test.ts', `export const t = ${MARCADOR}\n`)
  g('init', '-q', '-b', 'main')
  g('config', 'user.email', 't@t')
  g('config', 'user.name', 't')
  g('add', '-A')
  g('commit', '-q', '-m', 'base con controles')
  return repo
}
