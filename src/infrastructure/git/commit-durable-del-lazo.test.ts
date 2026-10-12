import { afterEach, describe, expect, it } from 'vitest'
import { asuntos, crearRepo, escribir, head, limpiar } from './checkpoint-fixture'
import { commitDurableDelLazo } from './commit-durable-del-lazo'

const dirs: string[] = []
const repo = (): string => {
  const d = crearRepo()
  dirs.push(d)
  return d
}
afterEach(() => limpiar(dirs))

describe('commitDurableDelLazo: aterriza el trabajo del agente (ATERRIZAJE-4)', () => {
  it('CLAVE: con cambios en un cliente -> HEAD avanza con fix(id): titulo', () => {
    const dir = repo()
    const antes = head(dir)
    escribir(dir, 'fix.sql', 'ALTER POLICY ...\n') // el agente edito
    expect(commitDurableDelLazo(dir, 'ID-Y', 'Subida anonima')).toBe('commiteado')
    expect(head(dir)).not.toBe(antes) // HEAD avanzo
    expect(asuntos(dir)[0]).toBe('fix(ID-Y): Subida anonima')
  })

  it('sin cambios -> sin-cambios (no commit vacio), HEAD quieto', () => {
    const dir = repo()
    const antes = head(dir)
    expect(commitDurableDelLazo(dir, 'ID', 'x')).toBe('sin-cambios')
    expect(head(dir)).toBe(antes)
  })

  it('NUNCA FORTRESS: package.json propio -> fortress, NO commitea', () => {
    const dir = repo()
    escribir(dir, 'package.json', JSON.stringify({ name: 'fortress-command-center' }))
    const antes = head(dir)
    expect(commitDurableDelLazo(dir, 'ID', 'x')).toBe('fortress')
    expect(head(dir)).toBe(antes)
  })
})
