import { describe, expect, it } from 'vitest'
import type { MedidaDelArbol } from '@domain/repair/asiento-de-la-medida'
import { medirLaTanda } from './medir-la-tanda'
import type { PropuestaEnCola } from './tanda-de-firma'

const p = (id: string, files: string[], branch: string | null = `repair/${id}`): PropuestaEnCola => ({ id, files, branch }) // prettier-ignore
const VERDE: MedidaDelArbol = { ok: true, comandos: ['test:unit'], detalle: '' }
const ROJA: MedidaDelArbol = { ok: false, comandos: ['test:unit'], detalle: '' }

/** La sonda del caso del 2-oct: rompe solo cuando juez y juzgado van juntos. */
const sondaDelPar = (malos: readonly string[]) => (ids: readonly string[]) =>
  Promise.resolve(malos.every((m) => ids.includes(m)) ? ROJA : VERDE)

describe('medirLaTanda (la sonda del conjunto + la biseccion)', () => {
  it('verde: las N entran juntas, UNA sola medida, firma en el orden sugerido', async () => {
    const r = await medirLaTanda([p('a', ['x.ts']), p('b', ['y.ts'])], () => Promise.resolve(VERDE)) // prettier-ignore
    expect(r.veredicto).toBe('verde')
    expect(r.medidas).toBe(1)
    expect(r.detalle).toContain('orden sugerido')
  })

  it('rojo: bisecta y NOMBRA a los culpables — el par del 2-oct, no un «rojo» mudo', async () => {
    const cola = [p('a', ['1.ts']), p('b', ['2.ts']), p('c', ['3.ts']), p('d', ['4.ts'])]
    const r = await medirLaTanda(cola, sondaDelPar(['b', 'd']))
    expect(r.veredicto).toBe('rojo')
    expect([...r.culpables].sort()).toEqual(['b', 'd'])
    expect(r.medidas).toBeGreaterThan(1)
  })

  it('las de DEPENDENCIAS quedan fuera de la sonda y al final de la guia', async () => {
    const vistos: (readonly string[])[] = []
    const cola = [p('dep', ['package.json']), p('a', ['x.ts']), p('b', ['y.ts'])]
    await medirLaTanda(cola, (ids) => (vistos.push(ids), Promise.resolve(VERDE)))
    expect(vistos[0]).toEqual(['a', 'b'])
  })

  it('sin rama legible no se sonda; con menos de dos medibles, sin-tanda y cero medidas', async () => {
    const r = await medirLaTanda([p('a', ['x.ts']), p('b', ['y.ts'], null)], () => Promise.resolve(ROJA)) // prettier-ignore
    expect(r.veredicto).toBe('sin-tanda')
    expect(r.medidas).toBe(0)
    expect(r.sondadas).toEqual(['a'])
  })
})
