/** Lo que el analista dijo en "mismoDefectoQue", sin fiarse: solo cadenas no
 *  vacias, una vez cada una. Quien decide si valen es `idsAdmitidos`. */
export function leerMismoDefecto(valor: unknown): readonly string[] {
  if (!Array.isArray(valor)) return []
  const ids = valor.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter((v) => v !== '') // prettier-ignore
  return [...new Set(ids)]
}
