import { afterEach, describe, expect, it, vi } from 'vitest'
import * as integrar from './integrar-si-procede'
import * as juzgar from './judge-and-integrate'
import { compila, ctx, DEPS, elige, genera, aprueba, juzga, PROPUESTA } from './run-motor-chain-fixture'
import { runMotorChain } from './run-motor-chain'

afterEach(() => vi.restoreAllMocks())

function hastaElJuicio(): void {
  elige(PROPUESTA)
  genera({ ok: true })
  compila({ ok: true })
  aprueba()
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

})

describe('el modo completo: integrar es de la cadena, no del juicio', () => {
  it('al juicio SIEMPRE se le prohibe integrar: entre el y el merge vive el lazo', async () => {
    hastaElJuicio()
    const espia = vi.spyOn(juzgar, 'judgeAndIntegrate')

    await runMotorChain(ctx('MERGEADO'), 'p1', DEPS, 'completo')
    // Antes del lazo (ADR-110) este argumento era `true` en completo. La
    // integracion no se perdio: se movio detras de las vueltas, y la prueba de
    // abajo es la que ahora la vigila.
    expect(espia.mock.calls[0]?.[3]).toBe(false)
  })

  it('no-regresion: en completo se integra, y en hasta-omega no', async () => {
    hastaElJuicio()
    const espia = vi.spyOn(integrar, 'integrarSiProcede').mockResolvedValue(null)

    await runMotorChain(ctx('MERGEADO'), 'p1', DEPS, 'completo')
    expect(espia).toHaveBeenCalledTimes(1)

    await runMotorChain(ctx('OMEGA'), 'p1', DEPS, 'hasta-omega')
    expect(espia).toHaveBeenCalledTimes(1)
  })
})
