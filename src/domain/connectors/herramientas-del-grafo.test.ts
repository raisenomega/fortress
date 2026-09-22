import { describe, expect, it } from 'vitest'
import { codigo, fuente, todos } from '@domain/repair/innegociables-fixture'
import { GRAPH_READ_TOOLS, HERRAMIENTAS_DEL_SERVIDOR } from './herramientas-del-grafo'

/**
 * EL TEST DERIVADO de la herramienta fantasma: un prompt solo puede nombrar lo
 * que el servidor de la version fijada EXPONE. Cuatro nombres —`list_projects`,
 * `index_status`, `check_index_coverage`, `detect_changes`— se escribieron a
 * mano contra otra version y el analista las pidio 243 veces (backlog, 6
 * proyectos). El universo son los nombres que el servidor ha tenido en alguna
 * version: lo que no este en la lista fijada no existe para el agente.
 */
const UNIVERSO = [
  'check_index_coverage', 'compare_graphs', 'delete_project', 'detect_changes', 'get_architecture',
  'get_code_snippet', 'get_file_outline', 'get_graph_schema', 'index_repository', 'index_status',
  'ingest_traces', 'list_projects', 'manage_adr', 'query_graph', 'search_code', 'search_graph', 'trace_path'
] // prettier-ignore
const NOMBRE = new RegExp(`\\b(${UNIVERSO.join('|')})\\b`, 'g')

/** Donde se le habla al agente: prompts, bloques del prompt y vocabularios. */
const ES_PROMPT =
  /prompt|callejon|grafo|instrucc|brief|plantilla|sentinel|herramientas-del-grafo|motor-tools|build-allowed-tools/

const hablan = todos.filter((ruta) => ES_PROMPT.test(ruta))

describe('ningun prompt nombra una herramienta que el servidor no expone', () => {
  it('el barrido encuentra ficheros que hablan al agente', () => {
    expect(hablan.length).toBeGreaterThanOrEqual(6)
  })

  it.each(hablan)('%s solo nombra herramientas del servidor fijado', (ruta) => {
    const nombradas = [...new Set([...codigo(fuente(ruta)).matchAll(NOMBRE)].map((m) => m[1]))]
    const fantasmas = nombradas.filter((n) => !HERRAMIENTAS_DEL_SERVIDOR.includes(n))
    expect({ ruta, fantasmas }).toEqual({ ruta, fantasmas: [] })
  })

  it('el allowlist del grafo se deriva de lo que el servidor expone, sin las de escritura', () => {
    const nombres = GRAPH_READ_TOOLS.map((t) => t.replace('mcp__codebase-memory__', ''))
    for (const n of nombres) expect(HERRAMIENTAS_DEL_SERVIDOR).toContain(n)
    expect(nombres).not.toContain('index_repository')
  })
})
