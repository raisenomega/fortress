import { afterEach, describe, expect, it, vi } from 'vitest'
import * as juzgar from './judge-and-integrate'
import { compila, ctx, DEPS, elige, genera, juzga, PROPUESTA } from './run-motor-chain-fixture'
import { runMotorChain } from './run-motor-chain'

afterEach(() => vi.restoreAllMocks())

/** Cadena con el gate en verde y el juicio doblado, listo para espiarlo. */
function hastaElGate(): void {
  elige(PROPUESTA)
  genera({ ok: true })
  compila({ ok: true })
  juzga({ omega: { ok: true }, merge: null })
}

describe('el motor puede parar tras el gate sin correr OMEGA', () => {
  it('con stopAtGate corta ahi y devuelve espera-omega', async () => {
    hastaElGate()
    const vuelta = await runMotorChain(ctx('GATE'), 'p1', DEPS, 'hasta-gate')

    expect(vuelta.ok && vuelta.value).toEqual({
      kind: 'espera-omega',
      proposalId: PROPUESTA.id
    })
  })

  it('y NO llama a judgeAndIntegrate: nada sale del worktree', async () => {
    hastaElGate()
    const espia = vi.spyOn(juzgar, 'judgeAndIntegrate')

    await runMotorChain(ctx('GATE'), 'p1', DEPS, 'hasta-gate')

    expect(espia).not.toHaveBeenCalled()
  })

  it('sin la bandera, la conducta es la de siempre: llega a OMEGA', async () => {
    hastaElGate()
    const espia = vi.spyOn(juzgar, 'judgeAndIntegrate')

    const vuelta = await runMotorChain(ctx('MERGEADO'), 'p1', DEPS)

    expect(espia).toHaveBeenCalledTimes(1)
    expect(vuelta.ok && vuelta.value.kind).toBe('integrada')
  })

  it('un gate en rojo corta antes, con bandera o sin ella', async () => {
    elige(PROPUESTA)
    genera({ ok: true })
    compila({ ok: false, reason: 'gate_failed' })

    const vuelta = await runMotorChain(ctx('GATE'), 'p1', DEPS, 'hasta-gate')
    expect(vuelta.ok && vuelta.value.kind).toBe('descartada')
  })
})
