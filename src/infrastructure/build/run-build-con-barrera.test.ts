import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { OperationMode } from '@domain/settings/operation-mode'
import { BARRERA_ROTA } from '../barrera-guard'
import { banco, conHooks, pathSinPython, restaurarPath, ROTO, SANO, unCliente } from '../barrera-guard-fixture' // prettier-ignore
import { runBuild } from './run-build'

// Solo el agente: armarlo lee conectores y claves que este banco no tiene, y el
// Ejecutor corta antes de usarlo (proyecto sin confianza). El resolutor es el real.
vi.mock('./build-target', async (real) => ({ ...(await real<object>()), agentFor: () => ({}) }))

beforeAll(pathSinPython)
afterAll(restaurarPath)

/** El banco de la guarda mas lo que `runBuild` toca al negar: el historial del chat. */
function contexto(comando: string, modo: OperationMode): { ctx: AppContext; historial: string[] } {
  const historial: string[] = []
  const chat = { add: (m: { content: string }) => (historial.push(m.content), { ...m, id: 'm1' }) }
  const ctx = { ...banco(unCliente(conHooks(comando)), modo), chat } as unknown as AppContext
  return { ctx, historial }
}

describe('el Ejecutor de Construir edita SIEMPRE: con la barrera muerta no arranca (ADR-105, casilla 3)', () => {
  it.each<OperationMode>(['supervisado', 'autonomo'])(
    'en %s: niega, y el recibo queda en el historial',
    async (modo) => {
      const { ctx, historial } = contexto(ROTO, modo)
      const r = await runBuild(ctx, 'p1', 'una feature', 'el plan')

      // Mejora sobre la rama B: el Ejecutor tambien recibe QUE barrera esta rota.
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toBe(`${BARRERA_ROTA} Rota: PreToolUse (Write|Edit|MultiEdit) llama a «python» protect-invariants.py, que no existe; existe «python3».`) // prettier-ignore
      expect(historial).toHaveLength(1)
      expect(historial[0]).toContain('Construccion no aplicada: ' + BARRERA_ROTA)
      expect(historial[0]).toContain('existe «python3»')
    }
  )

  it('y la observacion se asienta tambien por esta puerta', async () => {
    const { ctx } = contexto(ROTO, 'supervisado')
    await runBuild(ctx, 'p1', 'una feature', 'el plan')

    expect(ctx.selfObservations.listOpen()).toMatchObject([
      { kind: 'bug', area: 'barrera-del-proyecto' }
    ])
  })

  it('con la barrera SANA sigue hasta el Ejecutor, que corta por lo suyo (sin confianza)', async () => {
    const { ctx, historial } = contexto(SANO, 'autonomo')
    const r = await runBuild(ctx, 'p1', 'una feature', 'el plan')

    expect(r).toEqual({ ok: false, error: 'Ejecutor exige un proyecto de confianza' })
    expect(historial[0]).not.toContain('barrera')
    expect(ctx.selfObservations.listOpen()).toEqual([])
  })
})
