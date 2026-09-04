import { describe, expect, it } from 'vitest'
import { bench, hallazgo } from './plan-repair-fixture'
import { objetivo } from './plan-repair-dirigido-fixture'
import { planRepair } from './plan-repair'

const NUEVA = { ...hallazgo('f1', 'a.ts'), identity: 'a.ts|path-traversal|handleverify' }
const VIEJA = { ...hallazgo('f1', 'a.ts'), identity: 'LOW|a.ts|permite reenviar correos' }

describe('el objetivo llega al analista CON sus dos senas', () => {
  it('la clave actual le da tipo y simbolo, que antes se quedaban en la base', async () => {
    const b = bench({ findings: [NUEVA] })
    await planRepair(b.context, 'p1')

    expect(objetivo(b)).toMatchObject({ tipo: 'path-traversal', simbolo: 'handleverify' })
  })

  it('la clave VIEJA no inventa ninguna: null y el prompt calla', async () => {
    const b = bench({ findings: [VIEJA] })
    await planRepair(b.context, 'p1')

    expect(objetivo(b)).toMatchObject({ tipo: null, simbolo: null })
  })

  it('el resto del objetivo sigue entero: no se perdio nada por el camino', async () => {
    const b = bench({ findings: [NUEVA] })
    await planRepair(b.context, 'p1')

    expect(objetivo(b)).toMatchObject({ id: 'f1', severity: 'LOW', file: 'a.ts', line: 1 })
  })
})
