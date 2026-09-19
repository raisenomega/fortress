import { describe, expect, it } from 'vitest'
import type { CheckpointDelTurno } from '@domain/chat/red-de-reversion'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import type { StepProgress } from '../workflow/step-progress'
import type { AppContext } from '../context'
import { tribunalConCritico, type CorridaDelCritico } from './tribunal-con-critico'

const META: AnalystRunMeta = { durationMs: 10, startedAt: 0, endedAt: 10 }
const PLAN = { target: { title: 't', file: 'a.ts', line: 1 }, whatToChange: 'x', doNotTouch: 'y' }
const OK: CorridaDelCritico = { ok: true, texto: 'rompe api.ts:17', runMeta: META }

const cpCon = (tocados: readonly string[]): CheckpointDelTurno =>
  ({ diff: () => ({ diffText: 'd', tocados, previo: () => '', actual: () => '' }) }) as unknown as CheckpointDelTurno // prettier-ignore

const context = { runs: { record: () => undefined } } as unknown as AppContext

/** Lo que la barra recibe mientras el tribunal trabaja. */
async function loQueAvisa(tocados: readonly string[]): Promise<readonly StepProgress[]> {
  const avisos: StepProgress[] = []
  const tribunal = tribunalConCritico({
    context,
    projectId: 'p1',
    cwd: '/p',
    agentes: 3,
    avisar: (p) => avisos.push(p),
    critico: { run: () => Promise.resolve(OK) }
  })
  await tribunal(cpCon(tocados), PLAN as never)
  return avisos
}

/**
 * ADR-097, punto 2. El debate se anuncia MIENTRAS corre, no cuando acaba: el
 * critico tarda minutos —6m35 en el ensayo del 18-sep— y una barra que solo
 * habla al final deja al operador mirando un cronometro mudo.
 */
describe('el debate se ve en la barra', () => {
  it('avisa con la fase DEBATE al arrancar el tribunal', async () => {
    const [primero] = await loQueAvisa(['a.ts'])

    expect(primero).toMatchObject({ fase: 'debate', total: 3 })
  })

  it('avisa ANTES de que el critico conteste, no despues', async () => {
    // Si el aviso saliera al terminar, llegaria justo cuando ya no hace falta.
    expect(await loQueAvisa(['a.ts'])).toHaveLength(1)
  })

  it('sin ficheros tocados no hay debate, y no se anuncia uno', async () => {
    // Anunciar un debate que no va a ocurrir es la otra forma de mentir.
    expect(await loQueAvisa([])).toEqual([])
  })
})
