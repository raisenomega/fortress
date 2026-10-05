import { afterEach, describe, expect, it, vi } from 'vitest'
import { banco, libro } from './con-lazo-fixture'
import * as otra from './otra-vuelta-del-generador'
import * as cierre from './rojo-del-gate'
import * as compilar from './run-gate'
import type { MotorChainDeps } from './run-motor-chain'
import { gateConVuelta } from './vuelta-tras-el-rojo'

/** ADR-115 B2: el gate de la cadena del Motor, con una vuelta tras un rojo de
 *  codigo. Topes del lazo de siempre; si no hay vuelta, el rechazo aplazado. */
afterEach(() => vi.restoreAllMocks())
const APLAZADO = { failedAt: 'lint', errores: ['/w/a.ts 76:1  error  max-lines'], reason: 'gate_failed', detail: 'gate_failed_at=lint', evidence: {} } as const // prettier-ignore
const DEPS = { generate: {}, gate: { now: () => 42 }, judge: { omega: {} } } as unknown as MotorChainDeps // prettier-ignore

function montar(segundo: object = { ok: true }): Record<string, ReturnType<typeof vi.fn>> {
  const gate = vi.spyOn(compilar, 'runGate').mockResolvedValueOnce({ ok: false, reason: 'gate_failed', aplazado: APLAZADO }).mockResolvedValueOnce(segundo as never) // prettier-ignore
  const generador = vi.spyOn(otra, 'otraVueltaDelGenerador').mockResolvedValue({ ok: true, proposalId: 'p-1', commitSha: 'c', files: [], sesion: 'ses-2' }) // prettier-ignore
  const rechazo = vi
    .spyOn(cierre, 'rechazarAplazado')
    .mockResolvedValue({ ok: false, reason: 'gate_failed' })
  return { gate, generador, rechazo } as never
}

describe('un rojo de codigo con vuelta disponible', () => {
  it('reanuda al generador desde GENERADO con el encargo honesto, y vuelve a pasar el gate', async () => {
    const m = montar()
    const r = await gateConVuelta(banco(libro(['h1'])), 'p-1', DEPS, 'ses-1')
    expect(m.generador).toHaveBeenCalledWith(expect.anything(), 'p-1', expect.stringContaining('NO pasa el gate en lint'), 'ses-1', DEPS.generate, 'GENERADO') // prettier-ignore
    expect(m.gate.mock.calls[0]?.[3]).toEqual({ aplazarRojo: true })
    expect(m.gate.mock.calls[1]?.[3]).toBeUndefined()
    expect(r).toEqual({ ok: true, sesion: 'ses-2' })
    expect(m.rechazo).not.toHaveBeenCalled()
  })
})

describe('sin vuelta: el rechazo aplazado, y ni un generador mas', () => {
  it.each([
    ['tope de vueltas compartido (la primera ya cuenta)', ['h1', 'h2'], 0, 'ses-1'],
    ['tope de dolares', ['h1'], 4.9, 'ses-1'],
    ['sin sesion', ['h1'], 0, undefined]
  ] as const)('%s', async (_, huellas, gasto, sesion) => {
    const m = montar()
    expect(await gateConVuelta(banco(libro(huellas), gasto), 'p-1', DEPS, sesion)).toEqual({ ok: false, reason: 'gate_failed' }) // prettier-ignore
    expect(m.generador).not.toHaveBeenCalled()
    expect(m.rechazo).toHaveBeenCalledOnce()
  })

  it('si la vuelta del generador falla, el rojo aplazado no se queda colgado en GENERADO', async () => {
    const m = montar()
    m.generador.mockResolvedValue({ ok: false, reason: 'invalid_state', detail: 'x' })
    expect(await gateConVuelta(banco(libro(['h1'])), 'p-1', DEPS, 'ses-1')).toEqual({ ok: false, reason: 'invalid_state' }) // prettier-ignore
    expect(m.rechazo).toHaveBeenCalledOnce()
  })
})
