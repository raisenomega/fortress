import { describe, expect, it } from 'vitest'
import { aislarCulpables } from './aislar-culpables'

/**
 * Deuda #2, pieza 2 (dominio): la biseccion que aisla a los culpables de una
 * tanda roja. El caso que la pario es el del 2-oct: dos fixes VERDES por
 * separado y ROJOS juntos, sin compartir fichero (dde8e100 + ccb969e6) — un
 * solo culpable no existe, el culpable es el PAR.
 */
const ids = (n: number): string[] => Array.from({ length: n }, (_, i) => `p${i}`)

/** Una tanda que solo rompe cuando TODOS los nombrados estan dentro. */
const rompeConTodos = (malos: readonly string[]) => (s: readonly string[]) =>
  Promise.resolve(!malos.every((m) => s.includes(m)))

describe('aislarCulpables (la biseccion de la tanda roja)', () => {
  it('el PAR del 2-oct: verdes solos, rojos juntos — aisla a los dos', async () => {
    const { culpables, medidas } = await aislarCulpables(ids(8), rompeConTodos(['p1', 'p6']))
    expect([...culpables].sort()).toEqual(['p1', 'p6'])
    // Muchisimo menos que los 28 pares: la biseccion es lo que la hace viable.
    expect(medidas).toBeGreaterThan(0)
    expect(medidas).toBeLessThanOrEqual(12)
  })

  it('un culpable SOLO (rompe el gate el solito) se aisla en ~log N medidas', async () => {
    const { culpables, medidas } = await aislarCulpables(ids(9), rompeConTodos(['p4']))
    expect(culpables).toEqual(['p4'])
    expect(medidas).toBeLessThanOrEqual(8)
  })

  it('con dos candidatos ya no hay nada que partir: responde el par', async () => {
    const { culpables } = await aislarCulpables(['a', 'b'], rompeConTodos(['a', 'b']))
    expect([...culpables].sort()).toEqual(['a', 'b'])
  })

  it('con uno, el culpable es ese y no se mide nada', async () => {
    const { culpables, medidas } = await aislarCulpables(['a'], () => Promise.resolve(false))
    expect(culpables).toEqual(['a'])
    expect(medidas).toBe(0)
  })
})
