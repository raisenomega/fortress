import { loadCognition } from './cognition-service'
import { loadProjects } from './project-service'
import { loadCounts, loadFindings } from './scan-service'
import { refreshSessionUsage } from './telemetry-service'
import { loadTimeline } from './timeline-service'

/**
 * Releer despues de un escaneo no puede tumbar el escaneo. Si algo aqui
 * fallara, el resultado ya esta guardado y en pantalla: lo unico que pasa es
 * que alguna cifra se ve vieja hasta el siguiente refresco.
 */
export async function reloadAfterScan(projectId: string): Promise<void> {
  try {
    await Promise.all([
      loadFindings(projectId),
      loadCounts(),
      loadProjects(),
      refreshSessionUsage(),
      loadTimeline(projectId),
      // B2 escribe COGNITION-LOG.md al cerrar el escaneo; sin releerlo, el panel
      // se queda con el estado vacio de antes hasta cambiar de proyecto.
      loadCognition(projectId)
    ])
  } catch {
    // Silencio deliberado: el escaneo si termino.
  }
}
