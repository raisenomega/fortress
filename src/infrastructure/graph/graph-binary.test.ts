import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GRAPH_MCP_VERSION } from '@domain/connectors/graph-mcp'

let versiones: (string | null)[] = []
let instalaciones: string[][] = []

vi.mock('child_process', () => ({
  spawnSync: (): { status: number | null; stdout: string } => {
    const v = versiones.shift() ?? null
    return v === null ? { status: null, stdout: '' } : { status: 0, stdout: `cbm ${v}\n` }
  },
  execFileSync: (_cmd: string, args: string[]): void => void instalaciones.push(args)
}))

const { ensureGraphBinary } = await import('./graph-binary')
const nada = (): void => undefined

describe('ensureGraphBinary: el binario vale por su version, no por existir', () => {
  beforeEach(() => {
    versiones = []
    instalaciones = []
  })

  it('con la version fijada en PATH no instala nada', () => {
    versiones = [GRAPH_MCP_VERSION]
    ensureGraphBinary(nada)
    expect(instalaciones).toEqual([])
  })

  it('con otra version en PATH reinstala la fijada', () => {
    versiones = ['0.0.1', GRAPH_MCP_VERSION]
    ensureGraphBinary(nada)
    expect(instalaciones).toEqual([['install', '-g', `codebase-memory-mcp@${GRAPH_MCP_VERSION}`]])
  })

  it('sin binario lo instala y comprueba la version que quedo', () => {
    versiones = [null, GRAPH_MCP_VERSION]
    const lineas: string[] = []
    ensureGraphBinary((l) => lineas.push(l))
    expect(instalaciones).toHaveLength(1)
    expect(lineas.at(-1)).toContain(GRAPH_MCP_VERSION)
  })

  it('si tras instalar responde otra version, falla en vez de darlo por instalado', () => {
    versiones = ['0.0.1', '0.0.1']
    expect(() => ensureGraphBinary(nada)).toThrow(/0\.0\.1/)
  })

  it('si tras instalar no responde nada, falla', () => {
    versiones = [null, null]
    expect(() => ensureGraphBinary(nada)).toThrow(/nada/)
  })
})
