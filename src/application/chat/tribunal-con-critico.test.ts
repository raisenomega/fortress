import { describe, expect, it } from 'vitest'
import type { CheckpointDelTurno } from '@domain/chat/red-de-reversion'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { tribunalConCritico, type CorridaDelCritico } from './tribunal-con-critico'
import type { AppContext } from '../context'

const OBJECION = 'Rompe a quien lo llama: api.ts:17 esperaba null'
const META: AnalystRunMeta = { durationMs: 10, startedAt: 0, endedAt: 10 }
const PLAN = { target: { title: 't', file: 'a.ts', line: 1 }, whatToChange: 'x', doNotTouch: 'y' }

const cpCon = (tocados: readonly string[]): CheckpointDelTurno =>
  ({ diff: () => ({ diffText: 'd', tocados, previo: () => '', actual: () => '' }) }) as unknown as CheckpointDelTurno // prettier-ignore

/** Contexto minimo: solo interesa que la corrida quede asentada. */
function contextoQueApunta(): { context: AppContext; filas: () => readonly string[] } {
  const filas: string[] = []
  const context = {
    runs: { record: (r: { agentId: string }) => filas.push(r.agentId) }
  } as unknown as AppContext
  return { context, filas: () => filas }
}

const deps = (context: AppContext, corrida: CorridaDelCritico): Parameters<typeof tribunalConCritico>[0] => ({ // prettier-ignore
  context,
  projectId: 'p1',
  cwd: '/p',
  agentes: 3,
  avisar: () => {},
  critico: { run: () => Promise.resolve(corrida) }
})

/**
 * ADR-096. El tribunal de UN critico: devuelve lista aunque entre uno, y
 * FACTURA como cualquier agente — uno que trabaja sin constar es el silencio
 * que ADR-091 §0 prohibe.
 */
describe('el tribunal con un critico', () => {
  it('devuelve la objecion, en una LISTA aunque sea una', async () => {
    const { context } = contextoQueApunta()
    const tribunal = tribunalConCritico(deps(context, { ok: true, texto: OBJECION, runMeta: META }))

    expect(await tribunal(cpCon(['a.ts']), PLAN as never)).toEqual([OBJECION])
  })

  it('el critico FACTURA con su propio agentId', async () => {
    const { context, filas } = contextoQueApunta()
    const tribunal = tribunalConCritico(deps(context, { ok: true, texto: OBJECION, runMeta: META }))

    await tribunal(cpCon(['a.ts']), PLAN as never)

    expect(filas()).toEqual(['critico'])
  })

  it('si el critico falla: lista vacia, y la corrida CONSTA igual', async () => {
    // Gasto hubo aunque no dejara objecion: no facturarlo seria perder el rastro.
    const { context, filas } = contextoQueApunta()
    const fallo = { ok: false as const, error: 'timeout', timedOut: true, runMeta: META }
    const tribunal = tribunalConCritico(deps(context, fallo))

    expect(await tribunal(cpCon(['a.ts']), PLAN as never)).toEqual([])
    expect(filas()).toEqual(['critico'])
  })

  it('sin ficheros tocados no se molesta al critico, ni se factura', async () => {
    const { context, filas } = contextoQueApunta()
    const tribunal = tribunalConCritico(deps(context, { ok: true, texto: OBJECION, runMeta: META }))

    expect(await tribunal(cpCon([]), PLAN as never)).toEqual([])
    expect(filas()).toEqual([])
  })
})
