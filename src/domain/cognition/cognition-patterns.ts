import type { DetectedFinding } from '../scan/detected-finding'

/**
 * Los hallazgos del escaneo, como patrones que el panel lee (## PTN-ANO-NNN).
 * Se REGENERAN cada escaneo: un hallazgo arreglado desaparece del proximo,
 * en vez de reaparecer para siempre.
 */
export function buildPatterns(findings: readonly DetectedFinding[], at: string): string {
  const year = at.slice(0, 4)
  const fecha = at.slice(0, 10)

  return findings
    .map((f, i) =>
      [
        `## PTN-${year}-${String(i + 1).padStart(3, '0')}: ${f.title}`,
        '',
        'Estado: ACTIVE',
        `Severidad: ${f.severity}`,
        `Primera deteccion: ${fecha}`,
        'Veces detectado: 1',
        ''
      ].join('\n')
    )
    .join('\n')
}

/**
 * Patrones EXTINTOS: hallazgos que un escaneo posterior ya no encontro. No se
 * borran sin rastro — se registran RESUELTOS con evidencia (ubicacion original +
 * fecha). Es el ciclo de vida: un patron que ya no aplica se extingue, con prueba.
 */
export function buildExtinct(resolved: readonly DetectedFinding[], at: string): string {
  const year = at.slice(0, 4)
  const fecha = at.slice(0, 10)
  // Offset 900 para no chocar con la numeracion de los ACTIVE (001..).
  return resolved
    .map((f, i) =>
      [
        `## PTN-${year}-${String(900 + i)}: ${f.title}`,
        '',
        'Estado: EXTINTO',
        `Severidad: ${f.severity}`,
        `Resuelto: ${fecha}`,
        `Evidencia: el escaneo ya no lo reporta (ubicacion original ${f.file}:${f.line ?? '-'})`,
        ''
      ].join('\n')
    )
    .join('\n')
}

/** Mapa de atencion real: los archivos con hallazgos, pesados por cuantos tienen. */
export function buildAttention(findings: readonly DetectedFinding[]): string {
  const porArchivo = new Map<string, number>()
  for (const f of findings) porArchivo.set(f.file, (porArchivo.get(f.file) ?? 0) + 1)

  if (porArchivo.size === 0) return ['## MAPA DE ATENCION', '', 'Sin hallazgos.', ''].join('\n')

  const max = Math.max(...porArchivo.values())
  const lineas = [...porArchivo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([file, n]) => `${file}  ${(n / max).toFixed(2)}  ${n} hallazgo(s)`)

  return ['## MAPA DE ATENCION', '', ...lineas, ''].join('\n')
}
