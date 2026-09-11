import { describe, expect, it } from 'vitest'
import type { Proposal } from '@domain/repair/proposal'
import { bench, hallazgo } from './plan-repair-fixture'
import { objetivo } from './plan-repair-dirigido-fixture'
import { planRepair } from './plan-repair'

const NUEVA = {
  ...hallazgo('f1', 'a.ts'),
  identity: 'a.ts|1|path-traversal',
  simbolo: 'handleVerify'
}
const VIEJA = {
  ...hallazgo('f1', 'a.ts'),
  identity: 'LOW|a.ts|permite reenviar correos',
  simbolo: null
}

describe('el objetivo llega al analista CON sus dos senas', () => {
  it('el tipo sale de la clave y el simbolo de su columna (ADR-084)', async () => {
    const b = bench({ findings: [NUEVA] })
    await planRepair(b.context, 'p1')

    expect(objetivo(b)).toMatchObject({ tipo: 'path-traversal', simbolo: 'handleVerify' })
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

describe('el analista sabe si este hallazgo ya se intento reparar', () => {
  it('con una propuesta MERGEADA se lo dice, y manda comprobar el fichero', async () => {
    const b = bench({
      findings: [NUEVA],
      proposals: [{ findingId: 'f1', state: 'MERGEADO' } as Proposal]
    })
    await planRepair(b.context, 'p1')

    expect(objetivo(b).intentos).toContain('1 llegaron a MERGEADO')
  })

  it('las propuestas de OTRO hallazgo no cuentan como suyas', async () => {
    const b = bench({
      findings: [NUEVA],
      proposals: [{ findingId: 'otro', state: 'MERGEADO' } as Proposal]
    })
    await planRepair(b.context, 'p1')

    expect(objetivo(b).intentos).toBeNull()
  })

  it('sin expediente no se inventa historial', async () => {
    const b = bench({ findings: [NUEVA] })
    await planRepair(b.context, 'p1')

    expect(objetivo(b).intentos).toBeNull()
  })
})
