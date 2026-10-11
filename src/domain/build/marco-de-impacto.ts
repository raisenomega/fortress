import type { Severity } from '../shared/severity'
import type { Finding } from '../project/finding'
import type { MarcoDelKit } from './bloque-cto-kit'
import { esGrave } from './hallazgos-del-marco'
import { marcoDeLineas } from './marcos-del-libro'

/** El radio de impacto de UN hallazgo urgente, YA trazado por la app (fenced,
 *  B.4): cuántos lo llaman / llama y qué módulos toca. Dato, no autoridad. */
export interface ImpactoDeHallazgo {
  readonly severity: Severity
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly callers: number
  readonly callees: number
  readonly modulos: readonly string[]
}

/** Los top N CRITICAL/HIGH por urgencia (la cola ya viene ordenada): el radio
 *  de impacto es caro (N trazas), así que SOLO lo grave y acotado. */
export function topCriticosYAltos(vivos: readonly Finding[], n: number): readonly Finding[] {
  return vivos.filter(esGrave).slice(0, n)
}

/** De un qualified_name del grafo (`slug.src.a.b.fichero.simbolo`) al módulo
 *  `src/a/b`: sin el slug, el fichero ni el símbolo. Sin `src`: el penúltimo. */
export function moduloDe(qn: string): string {
  const partes = qn.split('.')
  const i = partes.indexOf('src')
  if (i < 0 || partes.length - 2 <= i) return partes.at(-2) ?? '?'
  return partes.slice(i, partes.length - 2).join('/')
}

/** El marco "radio de impacto" (B.4): una línea por hallazgo trazado. Vacío
 *  (sin grafo, o ninguno resolvió) → texto vacío que `bloqueCtoKit` deja caer. */
export function marcoDeImpacto(impactos: readonly ImpactoDeHallazgo[]): MarcoDelKit {
  if (impactos.length === 0) return marcoDeLineas('radio-de-impacto', [])
  const lineas = impactos.map((i) => {
    const afecta = i.modulos.length > 0 ? i.modulos.join(', ') : '—'
    return `${i.severity} · ${i.file}:${i.line ?? '?'} · ${i.title} → ${i.callers} callers, ${i.callees} callees · afecta: ${afecta}` // prettier-ignore
  })
  return marcoDeLineas('radio-de-impacto', [`radio de impacto de los ${impactos.length} más urgentes:`, ...lineas]) // prettier-ignore
}
