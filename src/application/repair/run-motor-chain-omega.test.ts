import { afterEach, describe, expect, it, vi } from 'vitest'
import * as juzgar from './judge-and-integrate'
import { compila, ctx, DEPS, elige, genera, juzga, PROPUESTA } from './run-motor-chain-fixture'
import { runMotorChain } from './run-motor-chain'

afterEach(() => vi.restoreAllMocks())

function hastaElJuicio(): void {
  elige(PROPUESTA)
  genera({ ok: true })
  compila({ ok: true })
  juzga({ omega: { ok: true }, merge: null })
}

describe('el modo hasta-omega: juzgar sin integrar', () => {
  it('llama al juicio pero le prohibe integrar', async () => {
    hastaElJuicio()
    const espia = vi.spyOn(juzgar, 'judgeAndIntegrate')

    await runMotorChain(ctx('OMEGA'), 'p1', DEPS, 'hasta-omega')

    expect(espia).toHaveBeenCalledTimes(1)
    expect(espia.mock.calls[0]?.[3]).toBe(false)
  })

  it('la aprobada sale esperando firma, sin condicion de politica', async () => {
    // `condition: null` es "aprobada sin que la politica llegara a mirar", que
    // es exactamente lo que pasa cuando el merge no es de esta vuelta.
    hastaElJuicio()
    const vuelta = await runMotorChain(ctx('OMEGA'), 'p1', DEPS, 'hasta-omega')

    expect(vuelta.ok && vuelta.value).toEqual({
      kind: 'espera-firma',
      proposalId: PROPUESTA.id,
      condition: null
    })
  })

  it('un veto de OMEGA sale descartado, no a la cola de firma', async () => {
    elige(PROPUESTA)
    genera({ ok: true })
    compila({ ok: true })
    juzga({ omega: { ok: false, reason: 'omega_vetado' }, merge: null })

    const vuelta = await runMotorChain(ctx('RECHAZADO'), 'p1', DEPS, 'hasta-omega')
    expect(vuelta.ok && vuelta.value.kind).toBe('descartada')
  })

  it('no-regresion: el modo completo si le deja integrar', async () => {
    hastaElJuicio()
    const espia = vi.spyOn(juzgar, 'judgeAndIntegrate')

    await runMotorChain(ctx('MERGEADO'), 'p1', DEPS, 'completo')
    expect(espia.mock.calls[0]?.[3]).toBe(true)
  })
})
