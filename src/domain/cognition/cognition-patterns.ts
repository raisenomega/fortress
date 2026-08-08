import type { DetectedFinding } from '../scan/detected-finding'
import { historyKey, patternId } from './pattern-id'

/** Titulo+severidad -> fecha de primera deteccion ya registrada en el log. */
export type FirstSeen = ReadonlyMap<string, string>

/** La fecha con la que ya figuraba, o la de hoy si el hallazgo es nuevo. */
function since(f: DetectedFinding, hoy: string, seen: FirstSeen): string {
  return seen.get(historyKey(f.severity, f.title)) ?? hoy
}

/**
 * Los hallazgos del escaneo, como patrones que el panel lee (## PTN-ANO-NNNNNN).
 * Se REGENERAN cada escaneo: un hallazgo arreglado desaparece del proximo,
 * en vez de reaparecer para siempre.
 *
 * El id sale del CONTENIDO del hallazgo, nunca de su posicion en la lista: el
 * indice hacia que `PTN-2026-001` designara un hallazgo distinto en cada
 * escaneo y que toda referencia entre sesiones apuntara al equivocado.
 */
export function buildPatterns(
  findings: readonly DetectedFinding[],
  at: string,
  seen: FirstSeen
): string {
  const hoy = at.slice(0, 10)

  return findings
    .map((f) => {
      const desde = since(f, hoy, seen)
      return [
        `## ${patternId(f, desde.slice(0, 4))}: ${f.title}`,
        '',
        'Estado: ACTIVE',
        `Severidad: ${f.severity}`,
        `Primera deteccion: ${desde}`,
        'Veces detectado: 1',
        ''
      ].join('\n')
    })
    .join('\n')
}

/**
 * Patrones EXTINTOS: hallazgos que un escaneo posterior ya no encontro. No se
 * borran sin rastro — se registran RESUELTOS con evidencia (ubicacion original +
 * fecha). Es el ciclo de vida: un patron que ya no aplica se extingue, con prueba.
 *
 * Lleva el MISMO id que llevaba activo, porque es el mismo hallazgo: asi se
 * puede seguir su vida entera. Antes se numeraban `900 + indice` sobre cada
 * tanda, y cada tanda nueva volvia a empezar en 900, colisionando.
 */
export function buildExtinct(
  resolved: readonly DetectedFinding[],
  at: string,
  seen: FirstSeen
): string {
  const hoy = at.slice(0, 10)

  return resolved
    .map((f) =>
      [
        `## ${patternId(f, since(f, hoy, seen).slice(0, 4))}: ${f.title}`,
        '',
        'Estado: EXTINTO',
        `Severidad: ${f.severity}`,
        `Resuelto: ${hoy}`,
        `Evidencia: el escaneo ya no lo reporta (ubicacion original ${f.file}:${f.line ?? '-'})`,
        ''
      ].join('\n')
    )
    .join('\n')
}
