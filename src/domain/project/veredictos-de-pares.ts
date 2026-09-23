import type { Fusion } from './fusion-de-duplicados'
import { fusionPorJuicio } from './fusion-por-juicio'
import type { FilaDelPar, Par } from './pares-candidatos'

/** Lo que devuelve el agente por par, sin fiarse de nada. */
export interface RespuestaDelPar {
  readonly par: string
  readonly veredicto?: unknown
  readonly razon?: unknown
}

export interface VeredictoDePar {
  readonly par: string
  readonly a: FilaDelPar
  readonly b: FilaDelPar
  /** `sin_decidir` no funde: es lo mismo que DISTINTOS para la base, y se dice. */
  readonly desenlace: 'mismo' | 'distintos' | 'sin_decidir'
  readonly razon: string
}

/** Solo MISMO funde. DISTINTOS, lo ilegible y lo que no llego dejan la base como esta (fail-closed). */
export function veredictosDePares(
  pares: readonly Par[],
  respuestas: readonly RespuestaDelPar[]
): readonly VeredictoDePar[] {
  // prettier-ignore
  const porPar = new Map(respuestas.map((r) => [r.par, r]))
  return pares.map((p) => {
    const r = porPar.get(p.id)
    const razon = typeof r?.razon === 'string' ? r.razon : ''
    if (r === undefined) return { par: p.id, a: p.a, b: p.b, desenlace: 'sin_decidir', razon: 'sin respuesta del agente' } // prettier-ignore
    if (r.veredicto === 'MISMO') return { par: p.id, a: p.a, b: p.b, desenlace: 'mismo', razon }
    if (r.veredicto === 'DISTINTOS')
      return { par: p.id, a: p.a, b: p.b, desenlace: 'distintos', razon }
    return { par: p.id, a: p.a, b: p.b, desenlace: 'sin_decidir', razon: `veredicto ilegible: ${String(r.veredicto)}` } // prettier-ignore
  })
}

/**
 * Las fusiones que salen de los MISMO, por COMPONENTES: dos pares que comparten
 * fila (a~b y b~c) son un solo defecto de tres filas, y fundir el par a~b y
 * despues el b~c dejaria a c apuntando a una absorbida. En cada componente
 * decide `fusionPorJuicio`: la mas antigua sobrevive y su clave manda.
 */
export function fusionesDelLote(veredictos: readonly VeredictoDePar[]): readonly Fusion[] {
  const padre = new Map<string, string>()
  const filas = new Map<string, FilaDelPar>()
  const raiz = (id: string): string => { const p = padre.get(id) ?? id; return p === id ? id : raiz(p) } // prettier-ignore
  for (const v of veredictos) {
    if (v.desenlace !== 'mismo') continue
    filas.set(v.a.id, v.a)
    filas.set(v.b.id, v.b) // prettier-ignore
    const ra = raiz(v.a.id),
      rb = raiz(v.b.id)
    if (ra !== rb) padre.set(rb, ra)
  }
  const grupos = new Map<string, FilaDelPar[]>()
  for (const f of filas.values()) (grupos.get(raiz(f.id)) ?? grupos.set(raiz(f.id), []).get(raiz(f.id)))?.push(f) // prettier-ignore
  const fusiones: Fusion[] = []
  for (const g of grupos.values()) {
    const fusion = fusionPorJuicio(g.map((f) => ({ id: f.id, identidad: f.identity, firstSeen: f.firstSeen })).sort((x, y) => x.id.localeCompare(y.id))) // prettier-ignore
    if (fusion !== null) fusiones.push(fusion)
  }
  return fusiones
}
