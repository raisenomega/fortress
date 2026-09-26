import { describe, expect, it } from 'vitest'
import { CBM_CACHE_DIR, entradaDelGrafo, GRAPH_SERVER, withGraph } from './graph-mcp'

const DIR = '/datos/grafo-por-turno/turno-abc'

describe('el grafo del turno lleva su propio store (ADR-095 enmienda, camino 1: withGraph)', () => {
  it('con directorio, la entrada del servidor lleva env CBM_CACHE_DIR y nada mas cambia', () => {
    expect(entradaDelGrafo(DIR)).toEqual({ type: 'stdio', command: 'codebase-memory-mcp', args: [], env: { [CBM_CACHE_DIR]: DIR } }) // prettier-ignore
    const cfg = JSON.parse(withGraph(null, DIR))
    expect(cfg.mcpServers[GRAPH_SERVER].env).toEqual({ CBM_CACHE_DIR: DIR })
  })

  it('sin directorio (las acciones de FORTRESS sobre la cache real) no hay env', () => {
    expect(entradaDelGrafo(null)).toEqual({
      type: 'stdio',
      command: 'codebase-memory-mcp',
      args: []
    })
    expect(JSON.parse(withGraph(null)).mcpServers[GRAPH_SERVER].env).toBeUndefined()
  })

  it('con directorio, el grafo aislado GANA al codebase-memory que traiga el proyecto: el muro no es opcional', () => {
    const propio = JSON.stringify({
      mcpServers: { [GRAPH_SERVER]: { command: 'node', args: ['otro.js'] } }
    })
    const cfg = JSON.parse(withGraph(propio, DIR))
    expect(cfg.mcpServers[GRAPH_SERVER]).toEqual(entradaDelGrafo(DIR))
  })

  it('el nombre de la variable es el que el binario 0.9.0 honra (medido: XDG_CACHE_HOME no)', () => {
    expect(CBM_CACHE_DIR).toBe('CBM_CACHE_DIR')
  })
})
