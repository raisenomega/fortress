import { presentSeverities, type SeverityCounts } from '../project/severity-counts'

/**
 * Cabecera minima cuando el proyecto aun no tiene COGNITION-LOG.md. El panel
 * lee este archivo; sin el, la memoria del proyecto no existe. Formato que el
 * parser entiende: bloques de nivel dos.
 */
export function cognitionBaseline(projectName: string): string {
  return [
    `# COGNITION-LOG — ${projectName}`,
    '',
    '## GENERACION ACTUAL',
    '',
    'Generacion: 0',
    '',
    '## REFLEXIONES POR SESION',
    ''
  ].join('\n')
}

function describe(score: number, counts: SeverityCounts): string {
  const partes = presentSeverities(counts).map((s) => `${counts[s]} ${s}`)
  const resumen = partes.length === 0 ? 'sin hallazgos' : partes.join(', ')
  return `Escaneo de seguridad: ${resumen}. Score ${score}/100.`
}

/**
 * Reflexion de una sesion, en el formato que espera parse-reflections:
 * `## SESION <fecha> · <proyecto>`. Se AÑADE, nunca se reescribe: la regla de
 * COGNITION es que un registro no se borra.
 */
export function buildReflectionEntry(
  projectName: string,
  at: string,
  score: number,
  counts: SeverityCounts
): string {
  const fecha = at.slice(0, 10)
  return ['', `## SESION ${fecha} · ${projectName}`, '', describe(score, counts), ''].join('\n')
}
