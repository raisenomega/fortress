import { mayor, type FilaAFusionar, type Fusion } from './fusion-de-duplicados'

/**
 * La fusion que decide un JUICIO (ADR-101 §3): filas con claves DISTINTAS que un
 * agente declaro el mismo defecto. Misma regla que ADR-071: la mas antigua
 * sobrevive y, a igual fecha, manda el id. `identidad` es la clave de la
 * ganadora; las de las absorbidas se retiran y pasan a ser alias de ella.
 */
export function fusionPorJuicio(filas: readonly FilaAFusionar[]): Fusion | null {
  if (filas.length < 2) return null
  const ganadora = filas.reduce(mayor)
  return {
    ganadora: ganadora.id,
    absorbidas: filas.filter((f) => f.id !== ganadora.id).map((f) => f.id),
    identidad: ganadora.identidad
  }
}

/** Los ids que el analista puede nombrar: SOLO los que se le citaron. Cualquier
 *  otro se ignora sin avisar (fail-closed), y los repetidos cuentan una vez. */
export function idsAdmitidos(
  dichos: readonly string[] | undefined,
  citados: readonly string[] | undefined
): readonly string[] {
  if (dichos === undefined || citados === undefined) return []
  const admitidos = new Set(citados)
  return [...new Set(dichos.filter((id) => admitidos.has(id)))]
}
