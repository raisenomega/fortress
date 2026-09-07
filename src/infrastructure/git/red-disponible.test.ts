import { afterEach, describe, expect, it } from 'vitest'
import { abrirCheckpoint, redDisponible } from './checkpoint-transitorio'
import { crearCarpetaSinGit, crearRepo, crearRepoSinHistoria, limpiar, subcarpeta } from './checkpoint-fixture' // prettier-ignore

const dirs: string[] = []
const guarda = (dir: string): string => {
  dirs.push(dir)
  return dir
}
afterEach(() => limpiar(dirs))

/**
 * `redDisponible` es la senal que degrada el modo ANTES de abrir nada, asi que
 * tiene que decir exactamente lo mismo que `abrirCheckpoint` diria despues: si
 * discreparan, o se degradaria con red o se editaria sin ella.
 */
describe('redDisponible dice lo mismo que abrirCheckpoint, sin abrir nada', () => {
  it('raiz de repo con historia: hay red, y abrir la abre', () => {
    const dir = guarda(crearRepo())
    expect(redDisponible(dir)).toBe(true)
    const cp = abrirCheckpoint(dir)
    expect(cp).not.toBeNull()
    cp!.conservar()
  })

  it.each([
    ['una carpeta sin git', () => guarda(crearCarpetaSinGit())],
    ['una subcarpeta de un repo', () => subcarpeta(guarda(crearRepo()))],
    ['un repo sin ningun commit', () => guarda(crearRepoSinHistoria())]
  ])('%s: no hay red, y abrir devuelve null', (_nombre, preparar) => {
    const dir = preparar()
    expect(redDisponible(dir)).toBe(false)
    expect(abrirCheckpoint(dir)).toBeNull()
  })
})
