import { describe, expect, it } from 'vitest'
import { reclasificar, type ZombiConCandidata } from './reclasificacion-de-zombis'

const candidata = { id: 'g1', file: 'a/index.ts', line: 364, tipo: 'relay-abierto', identity: 'a/index.ts|364|relay-abierto' } // prettier-ignore
const zombi = (over: Partial<ZombiConCandidata> = {}): ZombiConCandidata => ({
  id: 'z1', file: 'a/index.ts', line: 361, title: 't', severity: 'MEDIUM',
  identity: 'MEDIUM|a/index.ts|t', first_seen: '2026-08-04', candidata, ...over
}) // prettier-ignore

describe('reclasificar: lo que el agente dijo, comprobado antes de escribir nada', () => {
  it('con gemela: adopta SU identidad y SU tipo, para que la fusion las empate', () => {
    const [r] = reclasificar(
      [zombi()],
      [{ id: 'z1', tipo: 'relay-abierto', simbolo: 'handler', gemela: 'g1' }]
    )
    expect(r).toMatchObject({
      id: 'z1',
      tipo: 'relay-abierto',
      simbolo: 'handler',
      identidad_nueva: candidata.identity
    })
    expect(r.gemela?.id).toBe('g1')
    expect(r.nota).toBeNull()
  })

  it('si el agente eligio otro tipo que la gemela, manda la gemela y se anota', () => {
    const [r] = reclasificar(
      [zombi()],
      [{ id: 'z1', tipo: 'salida-sin-escapar', simbolo: 'h', gemela: 'g1' }]
    )
    expect(r.tipo).toBe('relay-abierto')
    expect(r.nota).toContain('salida-sin-escapar')
  })

  it('FAIL-CLOSED: una gemela que no es la candidata medida es un error, no una opinion', () => {
    expect(() =>
      reclasificar([zombi()], [{ id: 'z1', tipo: 'relay-abierto', simbolo: 'h', gemela: 'otra' }])
    ).toThrow(/gemela/)
    expect(() =>
      reclasificar(
        [zombi({ candidata: null })],
        [{ id: 'z1', tipo: 'relay-abierto', simbolo: 'h', gemela: 'g1' }]
      )
    ).toThrow(/gemela/)
  })
})

describe('reclasificar: sin gemela, o sin respuesta que valga', () => {
  it('sin gemela: identidad nueva de su propia linea con el tipo elegido; nada se funde', () => {
    const [r] = reclasificar(
      [zombi()],
      [{ id: 'z1', tipo: 'salida-sin-escapar', simbolo: 'h', gemela: null }]
    )
    expect(r.identidad_nueva).toBe('a/index.ts|361|salida-sin-escapar')
    expect(r.gemela).toBeNull()
  })

  it('un tipo fuera del vocabulario cae a otro y queda anotado; sin respuesta, igual', () => {
    const [a, b] = reclasificar([zombi({ id: 'z1' }), zombi({ id: 'z2', candidata: null })], [{ id: 'z1', tipo: 'inventado', simbolo: 'h', gemela: null }]) // prettier-ignore
    expect(a.tipo).toBe('otro')
    expect(a.nota).toContain('inventado')
    expect(b.tipo).toBe('otro')
    expect(b.nota).toContain('sin respuesta')
  })
})
