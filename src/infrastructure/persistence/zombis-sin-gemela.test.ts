import { describe, expect, it } from 'vitest'
import { baseCon, PROYECTO, VIEJA } from './red-de-la-fusion-fixture'
import { zombisSinGemela } from './zombis-sin-gemela'

/**
 * El selector del PASO B: las zombis que el paso A no toco porque no tienen
 * gemela. Ni una mas: ni las 66 vivas ADR-084 de mailbd (sanas, o ya
 * re-identificadas), ni una zombi con gemela (esa es del paso A), ni una extinta.
 */
const base = (): ReturnType<typeof baseCon> =>
  baseCon([
    { id: 'sola', identity: VIEJA, tipo: 'otro', file: 'a.ts', line: 10 },
    { id: 'con-gemela', identity: VIEJA, tipo: 'otro', file: 'b.ts', line: 20 },
    { id: 'gemela-de-b', identity: 'b.ts|21|relay-abierto', tipo: 'relay-abierto', file: 'b.ts', line: 21 },
    { id: 'otro-legitimo', identity: 'c.ts|1|otro', tipo: 'otro', file: 'c.ts', line: 1 },
    { id: 'extinta', identity: VIEJA, tipo: 'otro', lifecycle: 'EXTINCT', file: 'd.ts', line: 5 }
  ]) // prettier-ignore

describe('zombisSinGemela: solo las viejas vivas que no tienen fila de hoy al lado', () => {
  it('coge la que esta sola y deja fuera la que tiene gemela, la sana y la extinta', () => {
    expect(zombisSinGemela(base(), PROYECTO).map((z) => z.id)).toEqual(['sola'])
  })

  it('trae lo que el juicio necesita: fichero, linea, titulo, severidad, clave vieja', () => {
    const [z] = zombisSinGemela(base(), PROYECTO)
    expect(z).toMatchObject({
      file: 'a.ts',
      line: 10,
      title: 't',
      severity: 'MEDIUM',
      identity: VIEJA
    })
  })
})
