import { scoreBand } from './fortress-score'
import type { Project } from './project'

export type ScanStatus = 'nuevo' | 'sin-escanear' | 'solido' | 'aceptable' | 'riesgo'

/**
 * Un proyecto recien creado ('nuevo') aun no tiene marco aprobado; uno sin
 * escanear no tiene score que interpretar (su 0 es "desconocido", no "malo").
 * Distinguirlos evita alarmar sin motivo.
 */
export function scanStatus(project: Project): ScanStatus {
  if (project.configState === 'PENDIENTE_CONFIGURACION') return 'nuevo'
  if (project.lastScan === null) return 'sin-escanear'
  return scoreBand(project.fortressScore)
}

export const SCAN_LABEL: Record<ScanStatus, string> = {
  nuevo: 'Proyecto nuevo · vacío',
  'sin-escanear': 'Sin escanear',
  solido: 'Solido',
  aceptable: 'Aceptable',
  riesgo: 'En riesgo'
}
