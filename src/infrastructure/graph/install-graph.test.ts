import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { GraphStatus } from '@domain/graph/graph-status'

let escrituras = 0
let indexados = 0
let binarios = 0

vi.mock('./graph-binary', () => ({ ensureGraphBinary: (): void => void binarios++ }))
vi.mock('./write-project-mcp', () => ({ writeProjectMcp: (): void => void escrituras++ }))
vi.mock('./index-graph', () => ({
  indexGraph: (): Promise<void> => {
    indexados++
    return Promise.resolve()
  }
}))
vi.mock('./read-graph-index', () => ({ readGraphIndex: (): null => null }))
vi.mock('./detect-graph', () => ({
  detectGraph: (): GraphStatus => ({ state: 'no-instalado', server: null, source: null })
}))

const { installGraph } = await import('./install-graph')

function contexto(proyecto: { path: string; trusted: boolean } | null): AppContext {
  return {
    projects: { findById: () => proyecto, setGraph: (): void => undefined },
    settings: { get: () => null },
    apiKeys: { has: () => false, read: () => null }
  } as unknown as AppContext
}

const log = (): void => undefined

describe('installGraph exige confianza para tocar el repo', () => {
  beforeEach(() => {
    escrituras = 0
    indexados = 0
    binarios = 0
  })

  it('sin confianza: err, y ni .mcp.json ni sesion del CLI', async () => {
    const result = await installGraph(contexto({ path: '/tmp/p', trusted: false }), 'p', log)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('confianza')
    expect(escrituras).toBe(0)
    expect(indexados).toBe(0)
    expect(binarios).toBe(0)
  })

  it('proyecto que ya no existe: conserva su motivo y no toca nada', async () => {
    const result = await installGraph(contexto(null), 'p', log)
    expect(result).toEqual({ ok: false, error: 'El proyecto ya no existe' })
    expect(escrituras + indexados + binarios).toBe(0)
  })

  it('con confianza: escribe el .mcp.json e indexa', async () => {
    const result = await installGraph(contexto({ path: '/tmp/p', trusted: true }), 'p', log)
    expect(result.ok).toBe(true)
    expect(escrituras).toBe(1)
    expect(indexados).toBe(1)
  })
})
