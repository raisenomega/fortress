import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runMotorChain } from './run-motor-chain'
import { compila, ctx, DEPS, genera, juzga, verde } from './run-motor-chain-fixture'

beforeEach(() => void vi.restoreAllMocks())

describe('runMotorChain: un veredicto no es una averia', () => {
  it('el revisor veta: sale como resultado, no como error', async () => {
    // Quien envuelve esto reintenta sin descanso ante un error transitorio y
    // mata el ciclo ante el que no reconoce. Un veto viajando como error
    // mataria el loop por hacer justo lo que se le pide.
    verde()
    juzga({ omega: { ok: false, reason: 'omega_vetado' }, merge: null })

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
    genera({ ok: false, reason: 'provider_error' })

    expect(await runMotorChain(ctx(), 'proj', DEPS)).toEqual({
      ok: false,
      error: 'provider_error'
    })
  })

  it('NUESTRO reloj no es el proveedor: sale como desenlace, y la tanda sigue', async () => {
    // Viajando como error cortaba el drenaje entero por una sola propuesta.
    // Dos de los tres drenajes del 23-ago murieron asi, con el pozo lleno.
    verde()
    genera({ ok: false, reason: 'generator_timeout' })

    expect(await runMotorChain(ctx(), 'proj', DEPS)).toEqual({
      ok: true,
      value: { kind: 'descartada', proposalId: 'prop-1234abcd', motivo: 'generator_timeout' }
    })
  })

  it('y el reloj del revisor tampoco: el bug gemelo, del otro lado', async () => {
    verde()
    juzga({ omega: { ok: false, reason: 'omega_timeout' }, merge: null })

    expect(await runMotorChain(ctx(), 'proj', DEPS)).toMatchObject({ ok: true })
  })
})
