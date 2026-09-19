import { describe, expect, it } from 'vitest'
import type { CheckpointDelTurno } from '@domain/chat/red-de-reversion'
import type { StepProgress } from '../workflow/step-progress'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import type { AppContext } from '../context'
import { planDelTerminal } from '@domain/chat/plan-del-terminal'
import { FOCO } from './ciclo-de-convergencia-fixture'
import { juezConOmega } from './juez-del-turno'

const CP = { diff: () => ({ diffText: 'd', tocados: ['a.ts'], previo: () => '', actual: () => '' }) } as unknown as CheckpointDelTurno // prettier-ignore
const VACIO = { diff: () => ({ diffText: '', tocados: [], previo: () => '', actual: () => '' }) } as unknown as CheckpointDelTurno // prettier-ignore
// El plan REAL, compuesto como en produccion. Inventarlo a mano me costo dos
// vueltas: le faltaban campos que `buildOmegaPrompt` si usa.
const PLAN = planDelTerminal(FOCO, 'arregla la CSP')

const context = {
  runs: { record: () => undefined },
  // EMPTY_CORPUS y no `{ docs: [] }`: el corpus tiene mas forma, y el atajo ya
  // me rompio un test antes en esta misma sesion.
  corpus: { of: () => EMPTY_CORPUS }
} as unknown as AppContext

/** Un OMEGA que no llega a arrancar: basta para ver si el aviso salio antes. */
const omegaMudo = {
  run: () =>
    Promise.resolve({
      ok: false as const,
      error: 'sin revisor',
      timedOut: false,
      noArranco: true as const,
      runMeta: { durationMs: 0, startedAt: 0, endedAt: 0 }
    })
}

async function loQueAvisa(cp: CheckpointDelTurno): Promise<readonly StepProgress[]> {
  const avisos: StepProgress[] = []
  const juez = juezConOmega({ context, projectId: 'p1', cwd: '/p', agentes: 3, avisar: (p) => avisos.push(p), omega: omegaMudo }) // prettier-ignore
  await juez(cp, PLAN)
  return avisos
}

/**
 * ADR-097, punto 3. OMEGA tarda —71 s en el ensayo del 18-sep— y la barra
 * callaba. Ahora lo dice mientras juzga, no cuando acaba.
 */
describe('el juicio se ve en la barra', () => {
  it('avisa con la fase JUICIO al arrancar', async () => {
    const [primero] = await loQueAvisa(CP)

    expect(primero).toMatchObject({ fase: 'juicio', total: 3 })
  })

  it('avisa ANTES de consultar a OMEGA, aunque OMEGA ni arranque', async () => {
    // El aviso no depende de que el juicio salga bien: depende de que empiece.
    expect(await loQueAvisa(CP)).toHaveLength(1)
  })

  it('el juicio va el ULTIMO: el debate ya paso', async () => {
    const [primero] = await loQueAvisa(CP)

    expect(primero?.index).toBe(2)
  })

  it('sin ficheros tocados no se juzga, y no se anuncia un juicio', async () => {
    // Mismo criterio que el debate: no se anuncia lo que no va a ocurrir.
    expect(await loQueAvisa(VACIO)).toEqual([])
  })
})
