import { aTipoDeDefecto, type TipoDeDefecto } from '../scan/tipo-de-defecto'
import { isSeverity } from '../shared/severity'
import { findingIdentity } from './finding-identity'
import type { Candidata } from './gemela-de-la-zombi'

export interface ZombiConCandidata {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly title: string
  readonly severity: string
  readonly identity: string
  readonly first_seen: string
  readonly candidata: Candidata | null
}

/** Lo que devuelve el agente por hallazgo, sin fiarse de nada. */
export interface RespuestaDelAgente {
  readonly id: string
  readonly tipo?: unknown
  readonly simbolo?: unknown
  readonly gemela?: unknown
}

export interface Reclasificada {
  readonly id: string
  readonly tipo: TipoDeDefecto
  readonly simbolo: string
  readonly identidad_nueva: string
  readonly gemela: Candidata | null
  readonly nota: string | null
}

const identidad = (z: ZombiConCandidata, tipo: TipoDeDefecto): string =>
  findingIdentity({ severity: isSeverity(z.severity) ? z.severity : 'MEDIUM', title: z.title, file: z.file, line: z.line, tipo }) // prettier-ignore

/**
 * Lo que el agente dijo, COMPROBADO antes de que llegue a la base. Fail-closed:
 * una gemela que no sea la candidata medida es un error, no una opinion. Con
 * gemela, la zombi adopta la identidad y el tipo de la gemela —es lo unico que
 * hace que la fusion (por identidad completa, ADR-071) las empate—, y si el
 * agente eligio otro tipo se anota. Sin gemela, identidad nueva de su propia
 * linea con el tipo elegido, y nada se funde. Sin respuesta, o con un tipo
 * fuera del vocabulario, cae a `otro` y queda dicho en la nota.
 */
export function reclasificar(
  zombis: readonly ZombiConCandidata[],
  respuestas: readonly RespuestaDelAgente[]
): readonly Reclasificada[] {
  const porId = new Map(respuestas.map((r) => [r.id, r]))
  return zombis.map((z) => {
    const r = porId.get(z.id)
    if (r === undefined) return { id: z.id, tipo: 'otro', simbolo: '', identidad_nueva: identidad(z, 'otro'), gemela: null, nota: 'sin respuesta del agente' } // prettier-ignore
    const simbolo = typeof r.simbolo === 'string' ? r.simbolo.trim() : ''
    const elegido = aTipoDeDefecto(r.tipo)
    const notas: string[] = []
    if (elegido === 'otro' && r.tipo !== 'otro')
      notas.push(`tipo fuera del vocabulario: ${String(r.tipo)}`)
    if (r.gemela === null || r.gemela === undefined) {
      return { id: z.id, tipo: elegido, simbolo, identidad_nueva: identidad(z, elegido), gemela: null, nota: notas.join('; ') || null } // prettier-ignore
    }
    if (z.candidata === null || r.gemela !== z.candidata.id) {
      throw new Error(`${z.id}: gemela "${String(r.gemela)}" no es la candidata medida (${z.candidata?.id ?? 'ninguna'})`) // prettier-ignore
    }
    const tipo = aTipoDeDefecto(z.candidata.tipo)
    if (elegido !== tipo)
      notas.push(`el agente eligio ${elegido}; manda el tipo de la gemela (${tipo})`)
    return { id: z.id, tipo, simbolo, identidad_nueva: z.candidata.identity, gemela: z.candidata, nota: notas.join('; ') || null } // prettier-ignore
  })
}
