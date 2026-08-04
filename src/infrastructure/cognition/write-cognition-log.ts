import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
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
    const path = join(scan.projectPath, FILE)
    const existing = existsSync(path) ? readFileSync(path, 'utf8') : ''
    writeFileSync(
      path,
      rebuildLog(existing, scan.projectName, scan.findings, scan.score, scan.counts, scan.at)
    )
  } catch {
    // El escaneo ya esta persistido; perder la memoria no lo invalida.
  }
}
