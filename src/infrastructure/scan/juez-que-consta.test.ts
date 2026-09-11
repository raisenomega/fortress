import { beforeEach, describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import type { CodeAgent } from '@domain/chat/code-agent'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { Db } from '../persistence/database'
import { createMemoryDb, seedProject } from '../persistence/memory-db'
import { createSqliteAgentRunRepository } from '../persistence/sqlite-agent-run-repository'
import { agenteQueAsientaCorrida } from '../claude-code/agente-que-asienta'
import { crearJuez } from './juez-de-aplicabilidad'

/**
 * El defecto que este arco cierra, de punta a punta y sobre SQLite de verdad: el
 * juez corrio 12 veces en el escaneo de 199 minutos sin dejar UNA sola fila.
 */
const VEREDICTO =
  'APLICA:[{"modulo":"M8","aplica":"si","porque":"src/pagos.ts:31 cobra"}]:END-APLICA'

let db: Db
let context: AppContext

const agenteFalso = (): CodeAgent => ({
  isAvailable: () => true,
  precheck: () => null,
  run: async () => ({
    text: VEREDICTO,
    failed: false,
    denials: [],
    usage: { ...EMPTY_USAGE, outputTokens: 700, costUsd: 0.4 },
    tools: ['Grep'],
    edits: []
  })
})

const corridas = (): unknown[] => db.prepare('SELECT agent_id, kind, failed FROM agent_runs').all()

let juez: ReturnType<typeof crearJuez>

beforeEach(() => {
  db = createMemoryDb()
  seedProject(db, 'p1')
  context = { runs: createSqliteAgentRunRepository(db) } as unknown as AppContext
  juez = crearJuez(agenteQueAsientaCorrida(agenteFalso(), context, 'sistema'), 'p1')
})

describe('el juez de aplicabilidad deja rastro', () => {
  it('de cero filas a una, con su agente y su kind', async () => {
    expect(corridas()).toEqual([])

    await juez('/tmp/p', ['M8'], ['src'])

    expect(corridas()).toEqual([{ agent_id: 'scope-classifier', kind: 'sistema', failed: 0 }])
  })

  it('y la factura que trajo, que es lo que nadie estaba cobrando', async () => {
    await juez('/tmp/p', ['M8'], ['src'])

    const totales = context.runs.totalsFor('scope-classifier', 'p1')
    expect(totales.runs).toBe(1)
    expect(totales.usage.costUsd).toBe(0.4)
    expect(totales.usage.outputTokens).toBe(700)
  })

  it('doce paradas, doce filas: no se agregan ni se pisan', async () => {
    for (let i = 0; i < 12; i += 1) await juez('/tmp/p', ['M8'], ['src'])

    expect(context.runs.totalsFor('scope-classifier', 'p1').runs).toBe(12)
  })

  it('el veredicto sigue llegando: el decorador observa, no interfiere', async () => {
    const veredictos = await juez('/tmp/p', ['M8'], ['src'])

    expect(veredictos).toHaveLength(1)
    expect(veredictos[0]).toMatchObject({ modulo: 'M8', aplica: 'si' })
  })
})
