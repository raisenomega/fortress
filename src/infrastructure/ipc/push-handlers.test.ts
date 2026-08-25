import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import { ok, type Result } from '@domain/shared/result'

type Handler = (event: unknown, projectId: string) => Promise<Result<string>>

const handlers = new Map<string, Handler>()
let contaminado = false
let existe = true
let empujes = 0
let raiz = '/tmp/p' // lo que responde `git rev-parse --show-toplevel` en la carpeta
/** Listo para pushear: con remoto, escaneado y sin CRITICAL en el conteo. */
const listo = { id: 'p', path: '/tmp/p', gitRemote: 'g:p.git', lastScan: '2026-08-01' }
const proyecto = (): object | null => (existe ? { ...listo, contaminated: contaminado } : null)
const empujar = (): Promise<Result<string>> => Promise.resolve(ok(`empuje ${++empujes}`))
const context = {
  projects: { findById: () => proyecto() },
  findings: { countsByProject: () => ({}) },
  omegaLog: { append: (): void => undefined }
} as unknown as AppContext

vi.mock('electron', () => ({
  ipcMain: { handle: (canal: string, fn: Handler): void => void handlers.set(canal, fn) }
}))
vi.mock('child_process', () => ({ execFileSync: (): string => raiz }))
vi.mock('../git/git-push', () => ({ createGitPusher: () => ({ push: empujar }) }))
vi.mock('../persistence/app-context', () => ({ getAppContext: (): AppContext => context }))

const { registerPushHandlers } = await import('./push-handlers')
const { endMerge, tryBeginMerge } = await import('../run-control')

registerPushHandlers()

const falta: Handler = () => Promise.reject(new Error('push:run sin registrar'))
const push = (): Promise<Result<string>> => (handlers.get('push:run') ?? falta)({}, 'p')

describe('push:run pasa por guardMerge y por la raiz del repo', () => {
  beforeEach(() => {
    endMerge('p')
    contaminado = false
    existe = true
    empujes = 0
    raiz = '/tmp/p'
  })

  it('CAPA 4: un proyecto contaminado no llega a ejecutar git', async () => {
    contaminado = true
    expect(await push()).toEqual({ ok: false, error: expect.stringContaining('CONTAMINADO') })
    expect(empujes).toBe(0)
  })

  it('con una firma en curso rechaza con su motivo y NO empuja', async () => {
    tryBeginMerge('p')
    expect(await push()).toEqual({ ok: false, error: expect.stringContaining('integrando') })
    expect(empujes).toBe(0)
  })

  it('una subcarpeta de un repo padre no llega a ejecutar git', async () => {
    raiz = '/tmp'
    expect(await push()).toEqual({ ok: false, error: expect.stringContaining('raiz') })
    expect(empujes).toBe(0)
  })

  it('suelta el turno: dos pushes seguidos empujan los dos', async () => {
    await push()
    await push()
    expect(empujes).toBe(2)
  })

  it('suelta el turno tambien cuando el push no llega a ejecutarse', async () => {
    existe = false
    expect((await push()).ok).toBe(false)
    expect(tryBeginMerge('p')).toBe(true)
  })
})
