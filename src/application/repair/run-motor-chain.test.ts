import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as generar from './generate-fix'
import { runMotorChain } from './run-motor-chain'
import {
  compila,
  ctx,
  DEPS,
  elige,
  genera,
  juzga,
  PROPUESTA,
  verde
} from './run-motor-chain-fixture'

beforeEach(() => void vi.restoreAllMocks())

describe('runMotorChain: un veredicto no es una averia', () => {
  it('el revisor veta: sale como resultado, no como error', async () => {
    // Quien envuelve esto reintenta sin descanso ante un error transitorio y
    // mata el ciclo ante el que no reconoce. Un veto viajando como error
    // mataria el loop por hacer justo lo que se le pide.
    verde()
    juzga({ ok: false, reason: 'omega_vetado' })

    const r = await runMotorChain(ctx(), 'proj', DEPS)

    expect(r).toEqual({ ok: true, value: { kind: 'descartada', proposalId: 'prop-1234abcd', motivo: 'omega_vetado' } }) // prettier-ignore
  })

  it('el gate se pone rojo: tambien es veredicto', async () => {
    verde()
    compila({ ok: false, reason: 'gate_failed' })

    expect(await runMotorChain(ctx(), 'proj', DEPS)).toMatchObject({ ok: true })
  })

  it('el proveedor se cae: eso si es error, para que el loop espere', async () => {
    verde()
    genera({ ok: false, reason: 'generator_error' })

    expect(await runMotorChain(ctx(), 'proj', DEPS)).toEqual({
      ok: false,
      error: 'generator_error'
    })
  })
})

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
    expect(await runMotorChain(ctx('OMEGA'), 'proj', DEPS)).toMatchObject({ value: { kind: 'espera-firma' } }) // prettier-ignore
  })

  it('la politica dejo integrar: la propuesta acabo mergeada', async () => {
    verde()
    expect(await runMotorChain(ctx('MERGEADO'), 'proj', DEPS)).toMatchObject({ value: { kind: 'integrada' } }) // prettier-ignore
  })
})
