import type { AppContext } from '@application/context'
import { usesApiKey } from '@application/settings/read-auth-source'
import type { GraphStatus } from '@domain/graph/graph-status'
import { ejecutaConConfianza } from '@domain/repair/confianza'
import { nowIso } from '@domain/shared/id'
import { err, ok, type Result } from '@domain/shared/result'
import { detectGraph } from './detect-graph'
import { ensureGraphBinary } from './graph-binary'
import { indexGraph } from './index-graph'
import { readGraphIndex } from './read-graph-index'
import { writeProjectMcp } from './write-project-mcp'

/**
 * Instala/conecta el grafo de un proyecto: asegura el binario en PATH, escribe el
 * .mcp.json, indexa si falta indice, y persiste las stats (has_graph + nodos/
 * aristas/fecha) para que la ficha las muestre. Reporta progreso por `log`.
 */
export async function installGraph(
  context: AppContext,
  projectId: string,
  log: (line: string) => void
): Promise<Result<GraphStatus>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  // Escribir su .mcp.json y abrir `claude -p` con cwd en el repo carga sus hooks,
  // CLAUDE.md y servidores: es ejecutar lo que trae. Leer (reconcileGraph) no la pide.
  if (!ejecutaConConfianza(project)) {
    return err('Proyecto sin confianza: marcalo como de confianza para instalar el grafo')
  }

  ensureGraphBinary(log)
  writeProjectMcp(project.path)
  log('.mcp.json escrito.\n')

  if (readGraphIndex(project.path) === null) {
    log('Sin indice: indexando el repositorio (puede tardar)...\n')
    await indexGraph(project.path, usesApiKey(context) ? context.apiKeys.read() : null, log)
  }

  const stats = readGraphIndex(project.path)
  if (stats) {
    context.projects.setGraph(projectId, stats.nodes, stats.edges, stats.indexedAt ?? nowIso())
    log(`\nGrafo listo: ${stats.nodes} nodos, ${stats.edges} aristas.\n`)
  }
  return ok({ ...detectGraph(project.path), stats })
}
