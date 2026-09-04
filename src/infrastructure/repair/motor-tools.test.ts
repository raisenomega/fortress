import { describe, expect, it } from 'vitest'
import { GRAPH_READ_TOOLS } from '@domain/connectors/graph-mcp'
import { TOOLS_EDICION, TOOLS_LECTURA } from './motor-tools'

const listas = { lectura: TOOLS_LECTURA, edicion: TOOLS_EDICION }

describe('los tres agentes del motor alcanzan TODO el grafo de lectura', () => {
  it.each(Object.entries(listas))('%s concede las nueve del vocabulario', (_n, lista) => {
    // Derivado, no copiado: una herramienta nueva en el dominio llega sola.
    for (const tool of GRAPH_READ_TOOLS) expect(lista.split(',')).toContain(tool)
  })

  it('las cuatro que faltaban estan: list_projects era la que mas dolia', () => {
    // 79 observaciones de auto-mejora por la misma causa. En headless una tool
    // fuera de la lista se auto-deniega: el analista sacaba el nombre del
    // proyecto del mensaje de ERROR de search_graph, de rebote.
    for (const t of ['list_projects', 'index_status', 'query_graph', 'get_graph_schema']) {
      expect(TOOLS_LECTURA).toContain(`mcp__codebase-memory__${t}`)
    }
  })

  it('la lectura NO concede escritura: ni de grafo ni de ficheros', () => {
    for (const prohibida of ['index_repository', 'delete_project', 'ingest_traces', 'manage_adr']) {
      expect(TOOLS_LECTURA).not.toContain(prohibida)
    }
    expect(TOOLS_LECTURA.split(',')).not.toContain('Edit')
    expect(TOOLS_LECTURA.split(',')).not.toContain('Write')
  })

  it('el generador edita, pero sigue SIN Bash: el gate no es suyo', () => {
    expect(TOOLS_EDICION.split(',')).toContain('Edit')
    expect(TOOLS_EDICION.split(',')).toContain('Write')
    expect(TOOLS_EDICION.split(',')).not.toContain('Bash')
  })
})
