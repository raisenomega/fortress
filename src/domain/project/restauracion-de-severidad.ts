import { esTipoDeAuditoria } from '../scan/defectos-de-auditoria'
import { isSeverity } from '../shared/severity'
import type {
  Entrada,
  Excluida,
  FilaDeFamilia,
  Nota,
  Restauracion
} from './restauracion-de-severidad-tipos'

export type {
  Entrada,
  Excluida,
  FilaDeFamilia,
  Nota,
  Restauracion
} from './restauracion-de-severidad-tipos'

const ENTRADA = /^(.+?:(?:\d+|-))\s+(\w+)→(\w+)\s+\((.+?)\)$/

/** La evidencia de la nota, partida en entradas por sitio. Lo que no cuadra se ignora. */
export function entradasDeLaNota(evidence: string): ReadonlyMap<string, readonly Entrada[]> {
  const porSitio = new Map<string, Entrada[]>()
  for (const trozo of evidence.split(/;\s*/)) {
    const r = ENTRADA.exec(trozo.trim())
    if (r === null || !isSeverity(r[2]) || !isSeverity(r[3])) continue
    const lista = porSitio.get(r[1]) ?? []
    lista.push({ modelo: r[2], banda: r[3], ejes: r[4] })
    porSitio.set(r[1], lista)
  }
  return porSitio
}

const sitioDe = (f: FilaDeFamilia): string => `${f.file}:${f.line ?? '-'}`

/**
 * ADR-103 §3 — que filas recuperan la palabra del modelo. Fail-closed: una fila
 * entra solo si es de auditoria, no esta EXTINCT y la nota MAS RECIENTE que
 * nombra su sitio trae la misma banda que su severidad actual (una fila tocada
 * despues ya no cuadra y no se pisa). Dos palabras distintas para el mismo
 * sitio es ambiguo: no se toca y se lista. Idempotente por construccion: tras
 * restaurar, la banda de la entrada ya no coincide con la fila.
 */
export function planDeRestauracion(
  filas: readonly FilaDeFamilia[],
  notas: readonly Nota[]
): { readonly plan: readonly Restauracion[]; readonly excluidas: readonly Excluida[] } {
  const recientes = [...notas].sort((a, b) => (a.at < b.at ? 1 : -1)).map((n) => entradasDeLaNota(n.evidence)) // prettier-ignore
  const plan: Restauracion[] = []
  const excluidas: Excluida[] = []
  for (const f of filas) {
    if (f.lifecycle === 'EXTINCT') { excluidas.push({ id: f.id, razon: 'extinta' }); continue } // prettier-ignore
    if (!esTipoDeAuditoria(f.tipo)) { excluidas.push({ id: f.id, razon: 'no es de auditoria' }); continue } // prettier-ignore
    const cuadran = recientes.map((m) => (m.get(sitioDe(f)) ?? []).filter((e) => e.banda === f.severity)).find((es) => es.length > 0) // prettier-ignore
    if (cuadran === undefined) continue
    if (new Set(cuadran.map((e) => e.modelo)).size > 1) { excluidas.push({ id: f.id, razon: 'ambigua' }); continue } // prettier-ignore
    const a = cuadran[0].modelo
    if (a !== f.severity) plan.push({ id: f.id, file: f.file, line: f.line, tipo: f.tipo, title: f.title, de: f.severity, a }) // prettier-ignore
  }
  return { plan, excluidas }
}
