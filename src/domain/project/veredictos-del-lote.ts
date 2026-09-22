import { estaProbado, type Evidencia } from '../repair/evidencia-obsolescencia'
import { aTipoDeDefecto } from '../scan/tipo-de-defecto'
import { isSeverity } from '../shared/severity'
import { findingIdentity } from './finding-identity'
import type { RespuestaDelJuicio, Veredicto, ZombiAJuzgar } from './veredicto-del-lote-tipos'

export type { RespuestaDelJuicio, Veredicto, ZombiAJuzgar } from './veredicto-del-lote-tipos'

export const SIN_PRUEBA = 'obsoleto segun el agente, sin prueba comprobable'

const evidenciaDe = (r: RespuestaDelJuicio): Evidencia | undefined => {
  const e = r.evidencia
  if (e === undefined || typeof e.marcador !== 'string') return undefined
  return { marcador: e.marcador, forma: e.forma === 'presente' ? 'presente' : 'ausente' }
}

/**
 * Lo que el lote dijo, COMPROBADO contra el fichero de HOY antes de escribir
 * nada. Es la misma guarda que `extinguirSiObsoleto` (ADR-087): un OBSOLETO solo
 * muere si `estaProbado` confirma su marcador; sin prueba, o con el fichero
 * ilegible, queda MITIGADA con la nota y sigue en el tablero. Y todo lo que no
 * muere recibe su tipo y su identidad de hoy: deja de ser zombi. Lo que el
 * agente no contesto, o contesto sin sentido, no se toca y se dice.
 */
export function veredictosDelLote(
  zombis: readonly ZombiAJuzgar[],
  respuestas: readonly RespuestaDelJuicio[],
  contenidoDe: (file: string) => string | null
): readonly Veredicto[] {
  const porId = new Map(respuestas.map((r) => [r.id, r]))
  return zombis.map((z) => {
    const r = porId.get(z.id)
    if (r === undefined)
      return { id: z.id, desenlace: 'sin_decidir', motivo: 'sin respuesta del agente' }
    if (r.status !== 'REAL' && r.status !== 'OBSOLETO') return { id: z.id, desenlace: 'sin_decidir', motivo: `status ilegible: ${String(r.status)}` } // prettier-ignore
    const tipo = aTipoDeDefecto(r.tipo)
    const nota =
      tipo === 'otro' && r.tipo !== 'otro' ? `tipo fuera del vocabulario: ${String(r.tipo)}` : null
    const severity = isSeverity(z.severity) ? z.severity : 'MEDIUM'
    const hoy = { tipo, simbolo: typeof r.simbolo === 'string' ? r.simbolo.trim() : '', nota, identidad_nueva: findingIdentity({ severity, title: z.title, file: z.file, line: z.line, tipo }) } // prettier-ignore
    if (r.status === 'REAL') return { id: z.id, desenlace: 'real', razon: typeof r.razon === 'string' ? r.razon : '', ...hoy } // prettier-ignore
    const prueba = estaProbado(evidenciaDe(r), contenidoDe(z.file))
    if (prueba.probado) return { id: z.id, desenlace: 'extinguida', motivo: prueba.motivo, ...hoy }
    return {
      id: z.id,
      desenlace: 'sin_prueba',
      ...hoy,
      nota: `${SIN_PRUEBA}: ${prueba.motivo} en ${z.file}`
    }
  })
}
