import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as generar from './generate-fix'
import { runMotorChain } from './run-motor-chain'
import { ctx, DEPS, elige, frena, PROPUESTA, verde } from './run-motor-chain-fixture'

beforeEach(() => void vi.restoreAllMocks())

describe('runMotorChain: donde acaba la vuelta', () => {
  it('sin candidato elegible', async () => {
    elige(null)
    expect(await runMotorChain(ctx(), 'proj', DEPS)).toMatchObject({ value: { kind: 'sin-candidato' } }) // prettier-ignore
  })

  it('el analisis lo declara obsoleto: no se genera nada', async () => {
    elige({ ...PROPUESTA, state: 'CADUCADO' })
    const espia = vi.spyOn(generar, 'generateFix')

    expect(await runMotorChain(ctx(), 'proj', DEPS)).toMatchObject({ value: { kind: 'obsoleto' } })
    expect(espia).not.toHaveBeenCalled()
  })

  it('aprobada y sin integrar: espera firma', async () => {
    verde()
    expect(await runMotorChain(ctx('OMEGA'), 'proj', DEPS)).toMatchObject({ value: { kind: 'espera-firma', condition: null } }) // prettier-ignore
  })

  it('la politica dejo integrar: la propuesta acabo mergeada', async () => {
    verde()
    expect(await runMotorChain(ctx('MERGEADO'), 'proj', DEPS)).toMatchObject({ value: { kind: 'integrada' } }) // prettier-ignore
  })
})

describe('runMotorChain: por que no se integro viaja con el desenlace', () => {
  it('la lista de exclusion freno: la condicion llega al final de la vuelta', async () => {
    // Sin este dato, quien cuente denegaciones no puede: todo lo aprobado y no
    // integrado sale por la misma puerta y se vuelve indistinguible.
    verde()
    frena('blacklist')

    expect(await runMotorChain(ctx('OMEGA'), 'proj', DEPS)).toMatchObject({ value: { condition: 'blacklist' } }) // prettier-ignore
  })

  it('la integracion esta apagada: llega distinguible de una denegacion', async () => {
    verde()
    frena('disabled')

    expect(await runMotorChain(ctx('OMEGA'), 'proj', DEPS)).toMatchObject({ value: { condition: 'disabled' } }) // prettier-ignore
  })
})
