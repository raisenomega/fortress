import { existsSync, readFileSync, writeFileSync } from 'fs'
import { rutaContenida } from '../fs/ruta-contenida'
import type { CognitionScan } from '@domain/cognition/cognition-writer'
import { rebuildLog } from '@domain/cognition/rebuild-log'

const FILE = 'COGNITION-LOG.md'

/**
 * Reescribe COGNITION-LOG.md tras un escaneo: patrones REGENERADOS de los
 * hallazgos actuales (un hallazgo arreglado desaparece, no reaparece cada vez) +
 * la reflexion de la sesion (las viejas se conservan). Es lo que hace que la
 * memoria del proyecto acumule evidencia en vez de una sola frase.
 *
 * Mejor esfuerzo: si el disco falla, el escaneo ya esta guardado y perder la
 * memoria no lo invalida.
 */
export function writeScan(scan: CognitionScan): void {
  try {
    // null = el nombre resuelve fuera del proyecto (un enlace commiteado) o no
    // se pudo saber. No se escribe: sobrescribir el destino de ese enlace es
    // exactamente el ataque, y el contenido lleva titulos del propio repo.
    const path = rutaContenida(scan.projectPath, FILE)
    if (path === null) return
    const existing = existsSync(path) ? readFileSync(path, 'utf8') : ''
    writeFileSync(
      path,
      rebuildLog(
        existing,
        scan.projectName,
        scan.findings,
        scan.resolved,
        scan.score,
        scan.counts,
        scan.at
      )
    )
  } catch {
    // El escaneo ya esta persistido; perder la memoria no lo invalida.
  }
}
