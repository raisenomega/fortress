import type { DetectedFinding } from './detected-finding'
import { SEVERITIES, type Severity } from '../shared/severity'

const sitio = (f: DetectedFinding): string =>
  f.file === '' ? '(global)' : `${f.file}${f.line === null ? '' : `:${f.line}`}`

const fila = (f: DetectedFinding): string =>
  `| ${f.tipo ?? 'otro'} | ${f.title.replace(/\|/g, '/')} | \`${sitio(f)}\` |`

/** Una banda con los suyos, o nada: una tabla vacia no dice mas que el silencio. */
function banda(severidad: Severity, findings: readonly DetectedFinding[]): readonly string[] {
  const suyos = findings.filter((f) => f.severity === severidad)
  if (suyos.length === 0) return []

  return [
    '',
    `### ${severidad} (${suyos.length})`,
    '',
    '| Tipo | Hallazgo | Donde |',
    '| --- | --- | --- |',
    ...suyos.map(fila)
  ]
}

/**
 * Lo que ESTA corrida reporto, por severidad de mas grave a menos.
 *
 * No es el expediente: el score puntua tambien lo que sigue vivo sin que este
 * escaneo lo nombrara (ADR-065), y mezclar las dos listas haria pasar por
 * hallazgo de hoy lo que lleva tres escaneos ahi. El numero del veredicto dice
 * de cual de los dos habla.
 */
export function bloqueDeHallazgos(findings: readonly DetectedFinding[]): readonly string[] {
  if (findings.length === 0) {
    return ['## Hallazgos de esta corrida', '', 'Ninguno.']
  }
  return [
    `## Hallazgos de esta corrida (${findings.length})`,
    ...SEVERITIES.flatMap((severidad) => banda(severidad, findings))
  ]
}
