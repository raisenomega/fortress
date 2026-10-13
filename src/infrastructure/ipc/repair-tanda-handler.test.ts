import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { Result } from '@domain/shared/result'

type Handler = (event: unknown, id: string) => Promise<Result<unknown>>
const handlers = new Map<string, Handler>()
let medidas = 0
const proyecto = { path: '/tmp/p', contaminated: false, trusted: true }

vi.mock('../system/self-project', () => ({ isFortressRepo: () => false, selfProject: () => null }))
vi.mock('electron', () => ({
  ipcMain: { handle: (canal: string, fn: Handler): void => void handlers.set(canal, fn) }
}))
vi.mock('../repair/sonda-de-la-tanda', () => ({ sondaDeLaTanda: (): never => { throw new Error('sonda') } })) // prettier-ignore
vi.mock('@application/repair/tanda-de-firma', () => ({ propuestasDeTanda: (): Promise<[]> => Promise.resolve([]) })) // prettier-ignore
vi.mock('@application/repair/medir-la-tanda', () => ({
  medirLaTanda: (): Promise<string> => {
    medidas++
    return Promise.resolve('medida')
  }
}))
vi.mock('../persistence/app-context', () => ({
  getAppContext: (): AppContext =>
    ({ projects: { findById: () => proyecto } }) as unknown as AppContext
}))

const { registerTandaHandlers } = await import('./repair-tanda-handler')
const { endMerge, tryBeginMerge } = await import('../run-control')
registerTandaHandlers()
const falta: Handler = () => Promise.reject(new Error('repair:medir-tanda sin registrar'))
const medir = (): Promise<Result<unknown>> => (handlers.get('repair:medir-tanda') ?? falta)({}, 'p')

describe('repair:medir-tanda pide confianza antes de tomar el carril', () => {
  beforeEach(() => {
    endMerge('p')
    medidas = 0
    proyecto.trusted = true
  })

  it('sin confianza rechaza con proyecto_sin_confianza, no mide y no toma el carril', async () => {
    proyecto.trusted = false
    const r = await medir()
    expect(r.ok).toBe(false)
    expect(r.ok ? null : r.error).toBe('proyecto_sin_confianza')
    expect(medidas).toBe(0)
    expect(tryBeginMerge('p')).toBe(true)
  })

  it('con confianza mide y libera el carril', async () => {
    expect((await medir()).ok).toBe(true)
    expect(medidas).toBe(1)
    expect(tryBeginMerge('p')).toBe(true)
  })
})
