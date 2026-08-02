import type { Project } from './project'
import type { SeverityCounts } from './severity-counts'

export type PushState = 'listo' | 'criticals' | 'sin-escanear' | 'sin-remote'

/**
 * La regla de la spec es literal: se bloquean los repos con CRITICALs. Se mira
 * el conteo de hallazgos y no el score, porque el score es un resumen y los
 * resumenes pierden matices; aqui hace falta el hecho, no el promedio.
 *
 * Un proyecto sin escanear tampoco pasa. No es que se sepa que esta mal: es que
 * no se sabe nada, y esta app no da por bueno un push que no puede respaldar.
 */
export function pushState(project: Project, counts: SeverityCounts): PushState {
  if (!project.gitRemote) return 'sin-remote'
  if (project.lastScan === null) return 'sin-escanear'
  return counts.CRITICAL > 0 ? 'criticals' : 'listo'
}

export const PUSH_REASON: Record<PushState, string> = {
  listo: 'Sin CRITICAL en el ultimo escaneo',
  criticals: 'Hay CRITICAL sin resolver: el push queda bloqueado',
  'sin-escanear': 'Escanea el proyecto antes de pushear',
  'sin-remote': 'El proyecto no tiene un remoto git configurado'
}
