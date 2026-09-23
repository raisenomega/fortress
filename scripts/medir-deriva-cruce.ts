export interface Sitio {
  readonly file: string
  readonly line: number | null
  readonly tipo: string
}
export type Veredicto = 'conservado' | 'sustitucion' | 'faceta-extra' | 'nuevo'
export interface Cruzado extends Sitio {
  readonly veredicto: Veredicto
  readonly registrados: readonly string[]
  readonly title: string
}

const clave = (s: Sitio): string => `${s.file.toLowerCase()}:${s.line ?? '-'}`
const agrupar = (filas: readonly Sitio[]): Map<string, Set<string>> => {
  const m = new Map<string, Set<string>>()
  for (const f of filas) (m.get(clave(f)) ?? m.set(clave(f), new Set()).get(clave(f)))?.add(f.tipo)
  return m
}

/**
 * Lo emitido, cruzado con lo registrado POR SITIO y con TODOS sus tipos: un
 * sitio puede llevar varias filas registradas (duplicados historicos), y contar
 * un solo tipo por sitio daba por deriva lo que era conservado. Cuatro
 * veredictos: conservado (el tipo ya estaba en ese sitio), sustitucion (otro
 * tipo y ninguno de los registrados salio), faceta-extra (otro tipo ademas de
 * uno registrado que si salio: una segunda fila del mismo defecto), nuevo.
 */
export function cruzar(
  registradas: readonly Sitio[],
  emitidas: readonly (Sitio & { title: string })[]
): readonly Cruzado[] {
  // prettier-ignore
  const reg = agrupar(registradas), emi = agrupar(emitidas)
  return emitidas.map((e) => {
    const R = reg.get(clave(e))
    const registrados = R === undefined ? [] : [...R]
    if (R === undefined) return { ...e, veredicto: 'nuevo', registrados }
    if (R.has(e.tipo)) return { ...e, veredicto: 'conservado', registrados }
    const algunoSalio = [...(emi.get(clave(e)) ?? [])].some((t) => R.has(t))
    return { ...e, veredicto: algunoSalio ? 'faceta-extra' : 'sustitucion', registrados }
  })
}

/** Cuantas filas registradas volvieron a salir con su mismo tipo. */
export function reencontradas(registradas: readonly Sitio[], emitidas: readonly Sitio[]): number {
  const emi = agrupar(emitidas)
  return registradas.filter((r) => emi.get(clave(r))?.has(r.tipo) === true).length
}
