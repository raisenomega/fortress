import type { DetectedFinding } from '../scan/detected-finding'

/**
 * Identifica un hallazgo entre escaneos distintos. Hace falta porque cada
 * escaneo sustituye las filas anteriores: sin esto, descartar un falso
 * positivo duraria hasta el siguiente escaneo y volveria a aparecer.
 *
 * El titulo entra en la huella a proposito. Si el modelo reformula el texto,
 * la huella cambia y el descarte NO se hereda: el hallazgo reaparece y hay
 * que volver a descartarlo. Es molesto, pero falla del lado seguro. Usar solo
 * archivo y linea seria comodo y peligroso: descartar una cosa en app.ts:42
 * silenciaria cualquier problema futuro en esa misma linea.
 */
export function fingerprintOf(finding: DetectedFinding): string {
  const line = finding.line === null ? '-' : String(finding.line)
  const title = finding.title.trim().toLowerCase().replace(/\s+/g, ' ')

  return [finding.severity, finding.file, line, title].join('|')
}
