import { describe, expect, it } from 'vitest'
import { mensajeDurable } from './commit-durable'

describe('mensajeDurable: el mensaje del commit durable del lazo (ATERRIZAJE-4)', () => {
  it('formato fix(<id>): <titulo>, sin trailer', () => {
    expect(mensajeDurable('ID-Y', 'Subida anonima al bucket')).toBe('fix(ID-Y): Subida anonima al bucket') // prettier-ignore
  })

  it('recorta el titulo a UNA linea', () => {
    expect(mensajeDurable('X', 'linea 1\nlinea 2')).toBe('fix(X): linea 1')
  })

  it('recorta titulos largos (<=72 chars del titulo)', () => {
    const m = mensajeDurable('X', 'a'.repeat(100))
    expect(m.startsWith('fix(X): ')).toBe(true)
    expect(m.length).toBeLessThanOrEqual('fix(X): '.length + 72)
  })
})
