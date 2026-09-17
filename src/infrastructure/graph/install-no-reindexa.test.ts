import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { GraphStatus } from '@domain/graph/graph-status'

let indexados = 0
let persistidos: Array<{ nodes: number; edges: number }> = []

/** Un indice que YA existe: lo que readGraphIndex devuelve cuando el slug acierta. */
const STATS = {
  nodes: 11142,
  edges: 28435,
  files: 900,
  indexedAt: '2026-09-17T02:56:00Z',
  rootPath: '/media/jojo/onn Disk/raisen-nucleo'
}

vi.mock('./graph-binary', () => ({ ensureGraphBinary: (): void => undefined }))
vi.mock('./write-project-mcp', () => ({ writeProjectMcp: (): void => undefined }))
vi.mock('./index-graph', () => ({
  indexGraph: (): Promise<void> => {
    indexados++
    return Promise.resolve()
  }
}))
vi.mock('./read-graph-index', () => ({ readGraphIndex: (): typeof STATS => STATS }))
vi.mock('./detect-graph', () => ({
  detectGraph: (): GraphStatus => ({ state: 'no-instalado', server: null, source: null })
}))

const { installGraph } = await import('./install-graph')

function contexto(): AppContext {
  return {
    projects: {
      findById: () => ({ path: '/media/jojo/onn Disk/raisen-nucleo', trusted: true }),
      setGraph: (_id: string, nodes: number, edges: number): void =>
        void persistidos.push({ nodes, edges })
    },
    settings: { get: () => null },
    apiKeys: { has: () => false, read: () => null }
  } as unknown as AppContext
}

/**
 * Con el indice ENCONTRADO, instalar no vuelve a indexar. Es la mitad cara del
 * bug del slug: mientras `readGraphIndex` devolvia null, cada pulsacion de
 * «Instalar grafo» relanzaba un `claude -p` de hasta diez minutos sobre un repo
 * que ya estaba indexado, y al terminar la ficha seguia diciendo «sin indice».
 */
describe('con el grafo ya indexado, instalar NO reindexa', () => {
  it('no llama a indexGraph ni una vez', async () => {
    indexados = 0
    persistidos = []

    const r = await installGraph(contexto(), 'p1', () => undefined)

    expect(r.ok).toBe(true)
    expect(indexados).toBe(0)
  })

  it('y persiste las stats que encontro, en vez de dejar la ficha vacia', async () => {
    indexados = 0
    persistidos = []

    await installGraph(contexto(), 'p1', () => undefined)

    expect(persistidos).toEqual([{ nodes: 11142, edges: 28435 }])
  })
})
