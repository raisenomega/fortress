import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { GraphVerify } from '@domain/graph/graph-actions'

type Handler = (event: unknown, id: string) => Promise<GraphVerify>
const handlers = new Map<string, Handler>()
const avisos: string[] = []
let spawns = 0
const proyecto = { path: '/tmp/p', contaminated: false, trusted: true }

vi.mock('electron', () => ({
  ipcMain: { handle: (canal: string, fn: Handler): void => void handlers.set(canal, fn) }
}))
vi.mock('../graph/install-graph', () => ({ installGraph: (): void => undefined }))
vi.mock('../graph/ab-graph', () => ({ abGraph: (): void => undefined }))
vi.mock('../graph/verify-graph', () => ({
  verifyGraph: (): Promise<GraphVerify> => {
    spawns++
    return Promise.resolve({ connected: true, tools: ['search_graph'] })
  }
}))
vi.mock('../persistence/app-context', () => ({
  getAppContext: (): AppContext =>
    ({
      projects: { findById: () => proyecto },
      settings: { get: () => null },
      apiKeys: { has: () => false, read: () => null },
      runs: { usageSince: () => ({ costUsd: 0 }) }
    }) as unknown as AppContext
}))

const { registerGraphActionHandlers } = await import('./graph-action-handlers')
const { endRun, isRunning, tryBeginRun } = await import('../run-control')
registerGraphActionHandlers()
const NADA: GraphVerify = { connected: false, tools: [] }
const falta: Handler = () => Promise.reject(new Error('graph:verify sin registrar'))
const send = (_canal: string, chunk: { delta: string }): void => void avisos.push(chunk.delta)
const event = { sender: { isDestroyed: () => false, send } }
const verify = (): Promise<GraphVerify> => (handlers.get('graph:verify') ?? falta)(event, 'p')

describe('graph:verify pide confianza y pasa por guardRun', () => {
  beforeEach(() => {
    endRun('p')
    avisos.length = 0
    spawns = 0
    Object.assign(proyecto, { contaminated: false, trusted: true })
  })

  it('sin confianza no spawnea ni toma el carril, y avisa del motivo', async () => {
    proyecto.trusted = false
    expect([await verify(), spawns, isRunning('p')]).toEqual([NADA, 0, false])
    expect(avisos[0]).toContain('sin confianza')
  })

  it('CAPA 4: un proyecto contaminado no llega a spawnear el CLI', async () => {
    proyecto.contaminated = true
    expect(await verify()).toEqual(NADA)
    expect(spawns).toBe(0)
    expect(avisos[0]).toContain('CONTAMINADO')
  })

  it('con el carril ya tomado rechaza, avisa del motivo y NO spawnea', async () => {
    tryBeginRun('p')
    expect(await verify()).toEqual(NADA)
    expect(spawns).toBe(0)
    expect(avisos[0]).toContain('Ya hay una ejecucion')
  })

  it('reserva el turno y lo libera: dos verificaciones seguidas corren las dos', async () => {
    expect(await verify()).toEqual({ connected: true, tools: ['search_graph'] })
    expect(isRunning('p')).toBe(false)
    await verify()
    expect(spawns).toBe(2)
  })
})
