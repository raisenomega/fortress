import { scoreBand } from './fortress-score'
import type { Project } from './project'

export type ScanStatus = 'sin-escanear' | 'solido' | 'aceptable' | 'riesgo'

/**
 * Un proyecto sin escanear no tiene score que interpretar: su 0 significa
 * "desconocido", no "malo". Distinguirlo evita alarmar sin motivo.
 */
export function scanStatus(project: Project): ScanStatus {
  if (project.lastScan === null) return 'sin-escanear'
  return scoreBand(project.fortressScore)
}

export const SCAN_LABEL: Record<ScanStatus, string> = {
  'sin-escanear': 'Sin escanear',
  solido: 'Solido',
  aceptable: 'Aceptable',
  riesgo: 'En riesgo'
}

/**
 * Solo se puede afirmar que un repo esta listo para push cuando hay un escaneo
 * que lo respalde. Sin datos, la respuesta es "no lo se", nunca "si".
 */
export function pushVerdict(project: Project): 'listo' | 'bloqueado' | 'desconocido' {
  if (project.lastScan === null) return 'desconocido'
  return scoreBand(project.fortressScore) === 'riesgo' ? 'bloqueado' : 'listo'
}
