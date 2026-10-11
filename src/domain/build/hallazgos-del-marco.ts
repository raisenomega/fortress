import type { Finding } from '../project/finding'

const NOTA_MAX = 80

/** Lo que no se puede dejar caer del tope: CRITICAL y HIGH. */
export const esGrave = (f: Finding): boolean => f.severity === 'CRITICAL' || f.severity === 'HIGH'

/**
 * El estado NO por defecto, marcado como en el tablero. Un descartado
 * (false_positive) o un mitigado (MITIGATED) NO es un vivo-abierto, y el CTO no
 * debe tratarlo como tal: se MARCA, no se oculta — ve la decision del operador.
 */
export function marcaDeEstado(f: Finding): string {
  const marcas: string[] = []
  if (f.status === 'false_positive') marcas.push('DESCARTADO')
  if (f.lifecycle === 'MITIGATED') marcas.push('MITIGADO')
  return marcas.join('·')
}

/** Una nota breve si la hay: la del operador (mitigacion) o la del analista. */
export function notaBreve(f: Finding): string {
  const nota = f.mitigatedNote ?? f.verificacionNote
  if (!nota) return ''
  return nota.length > NOTA_MAX ? `${nota.slice(0, NOTA_MAX)}…` : nota
}

/** Una linea por hallazgo: severity·file:line·title + marca de estado + nota. */
export function lineaDeHallazgo(f: Finding): string {
  const base = `${f.severity} · ${f.file}:${f.line ?? '?'} · ${f.title}`
  const marca = marcaDeEstado(f)
  const nota = notaBreve(f)
  return `${base}${marca ? ` [${marca}]` : ''}${nota ? ` — ${nota}` : ''}`
}
