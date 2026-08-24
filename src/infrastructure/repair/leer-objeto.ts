/**
 * El objeto JSON de la respuesta de un agente, o `null` si no habia ninguno o el
 * que habia no se dejo leer.
 *
 * El barrido es CODICIOSO —del primer `{` al ultimo `}`— y eso obliga a que la
 * respuesta traiga un solo objeto: dos bloques se mezclan en uno que ya no
 * parsea. El prompt lo pide por escrito y explica el motivo; cuando aun asi
 * llega mal, quien llama lo degrada diciendo que no se dejo leer, no inventando
 * un contenido.
 */
export function leerObjeto(texto: string): Record<string, unknown> | null {
  const match = texto.match(/\{[\s\S]*\}/)
  if (match === null) return null
  try {
    return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    return null
  }
}
