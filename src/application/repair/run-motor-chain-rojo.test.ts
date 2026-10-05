import { beforeEach, describe, expect, it, vi } from 'vitest'
import { libro } from './con-lazo-fixture'
import * as otra from './otra-vuelta-del-generador'
import * as compilar from './run-gate'
import { runMotorChain } from './run-motor-chain'
import { aprueba, ctx, DEPS, elige, genera, PROPUESTA } from './run-motor-chain-fixture'

/** ADR-115 B2, de punta a punta en la cadena: un rojo de codigo en el primer gate
 *  ya no acaba la vuelta. El generador recibe el error, el gate se repite, y la
 *  propuesta llega a la firma. */
beforeEach(() => void vi.restoreAllMocks())
const ROJO = { ok: false, reason: 'gate_failed', aplazado: { failedAt: 'lint', errores: ['/w/a.ts 1:1  error  x'], reason: 'gate_failed', detail: 'gate_failed_at=lint', evidence: {} } } // prettier-ignore

describe('la cadena del Motor reanuda el rojo de codigo', () => {
  it('pide el gate aplazado, da la vuelta y sigue hasta la firma', async () => {
    elige(PROPUESTA)
    genera({ ok: true, sesion: 'ses-1' })
    const gate = vi.spyOn(compilar, 'runGate').mockResolvedValueOnce(ROJO as never).mockResolvedValueOnce({ ok: true }) // prettier-ignore
    const vuelta = vi.spyOn(otra, 'otraVueltaDelGenerador').mockResolvedValue({ ok: true, proposalId: 'p', commitSha: 'c', files: [], sesion: 'ses-2' }) // prettier-ignore
    aprueba()
    const r = await runMotorChain(ctx('OMEGA', libro(['h1'])), 'proj', DEPS)
    expect(gate.mock.calls[0]?.[3]).toEqual({ aplazarRojo: true })
    expect(vuelta).toHaveBeenCalledOnce()
    expect(r).toMatchObject({ value: { kind: 'espera-firma' } })
  })
})
