import { describe, expect, it } from 'vitest'
import { GRAPH_READ_TOOLS } from '@domain/connectors/graph-mcp'
import { TOOLS_EDICION, TOOLS_LECTURA } from './motor-tools'

const listas = { lectura: TOOLS_LECTURA, edicion: TOOLS_EDICION }

describe('los tres agentes del motor alcanzan TODO el grafo de lectura', () => {
  it.each(Object.entries(listas))('%s concede las nueve del vocabulario', (_n, lista) => {
    // Derivado, no copiado: una herramienta nueva en el dominio llega sola.
    for (const tool of GRAPH_READ_TOOLS) expect(lista.split(',')).toContain(tool)
  })

  it('las que faltaban y EXISTEN estan: query_graph y get_graph_schema', () => {
    // 79 observaciones de auto-mejora por la misma causa. En headless una tool
    // fuera de la lista se auto-deniega. (`list_projects` e `index_status` NO
    // existen en el servidor fijado: concederlas era una fantasma mas.)
    for (const t of ['query_graph', 'get_graph_schema']) {
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

  it('el generador edita; Bash no esta en la lista (la lista no lo quita: lo tiene igual)', () => {
    expect(TOOLS_EDICION.split(',')).toContain('Edit')
    expect(TOOLS_EDICION.split(',')).toContain('Write')
    expect(TOOLS_EDICION.split(',')).not.toContain('Bash')
  })
})

describe('el VOCABULARIO en si, no solo que se derive de el', () => {
  it('NO lleva las fantasma: el servidor fijado no las expone (medido por tools/list)', () => {
    // Aqui se exigian `check_index_coverage` y `detect_changes` por su nombre,
    // y el analista las pidio 243 veces a un servidor que no las tiene.
    for (const f of ['check_index_coverage', 'detect_changes', 'list_projects', 'index_status']) {
      expect(GRAPH_READ_TOOLS).not.toContain(`mcp__codebase-memory__${f}`)
    }
  })

  it('sigue sin conceder ninguna de ESCRITURA', () => {
    for (const escribe of ['index_repository', 'delete_project', 'ingest_traces', 'manage_adr']) {
      expect(GRAPH_READ_TOOLS).not.toContain(`mcp__codebase-memory__${escribe}`)
    }
  })
})
