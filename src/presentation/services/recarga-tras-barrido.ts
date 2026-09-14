import { loadProjects } from './project-service'
import { loadCounts, loadFindings } from './scan-service'

/**
 * Releer despues del barrido no puede tumbar el barrido: lo verificado ya esta
 * en la base y el parte en pantalla. El score se toca —los extinguidos salen del
 * expediente y los que siguen vivos vuelven a la cola—, asi que la lista de
 * proyectos tambien queda vieja, no solo la tabla.
 */
export async function releerTrasElBarrido(projectId: string): Promise<void> {
  try {
    await Promise.all([loadFindings(projectId), loadCounts(), loadProjects()])
  } catch {
    // Silencio deliberado: el barrido si termino.
  }
}
