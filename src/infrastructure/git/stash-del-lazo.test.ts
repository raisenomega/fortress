import { afterEach, describe, expect, it } from 'vitest'
import { crearRepo, escribir, existe, git, limpiar } from './checkpoint-fixture'
import { popDelLazo, stashDelLazo } from './stash-del-lazo'

const dirs: string[] = []
const repo = (): string => {
  const d = crearRepo()
  dirs.push(d)
  return d
}
afterEach(() => limpiar(dirs))

describe('stash/pop del lazo: arbol limpio reversible (ATERRIZAJE-4)', () => {
  it('stash limpia el arbol; pop RESTAURA el WIP (mutar no-pop = WIP perdido)', () => {
    const dir = repo()
    escribir(dir, 'wip.txt', 'trabajo del usuario\n')
    expect(stashDelLazo(dir)).toBe(true)
    expect(existe(dir, 'wip.txt')).toBe(false) // arbol limpio durante el turno
    expect(popDelLazo(dir)).toBe('restaurado')
    expect(existe(dir, 'wip.txt')).toBe(true) // WIP restaurado al parar
  })

  it('sin WIP -> stash no guarda nada; pop vacio', () => {
    const dir = repo()
    expect(stashDelLazo(dir)).toBe(false)
    expect(popDelLazo(dir)).toBe('vacio')
  })

  it('solo hace pop del stash NUESTRO (por la marca): no toca el del usuario', () => {
    const dir = repo()
    escribir(dir, 'u.txt', 'del usuario\n')
    git(dir, 'stash', 'push', '-u', '-m', 'stash-del-usuario')
    expect(popDelLazo(dir)).toBe('vacio') // el top no es nuestro
    expect(git(dir, 'stash', 'list').includes('stash-del-usuario')).toBe(true) // sigue intacto
  })
})
