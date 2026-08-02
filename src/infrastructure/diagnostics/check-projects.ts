import { existsSync, statSync } from 'fs'
import type { HealthCheck } from '@domain/health/health-check'
import type { Project } from '@domain/project/project'

const ID = 'proyectos'
const LABEL = 'Proyectos conectados'

function isMissing(project: Project): boolean {
  try {
    return !existsSync(project.path) || !statSync(project.path).isDirectory()
  } catch {
    return true
  }
}

/**
 * Un proyecto movido o borrado en disco no rompe la app, pero cualquier scan
 * sobre el fallaria. Por eso es advertencia y se nombra cual.
 */
export function checkProjects(projects: readonly Project[]): HealthCheck {
  if (projects.length === 0) {
    return {
      id: ID,
      label: LABEL,
      level: 'ok',
      detail: 'Ningun proyecto agregado todavia',
      fix: null
    }
  }

  const missing = projects.filter(isMissing)
  if (missing.length === 0) {
    return { id: ID, label: LABEL, level: 'ok', detail: `${projects.length} accesibles`, fix: null }
  }

  return {
    id: ID,
    label: LABEL,
    level: 'warning',
    detail: `Sin acceso en disco: ${missing.map((project) => project.name).join(', ')}`,
    fix: 'Vuelve a agregar el proyecto con la ruta nueva, o quitalo de FORTRESS si ya no existe.'
  }
}
