/**
 * El mensaje del COMMIT DURABLE del lazo (ATERRIZAJE-4): `fix(<finding-id>):
 * <titulo>` — SIN trailer (CLAUDE.md §3), el titulo a UNA linea y recortado para
 * no desbordar el asunto. Puro: la decision de QUE escribir, aparte del git.
 */
export function mensajeDurable(findingId: string, titulo: string): string {
  const corto = titulo.split('\n')[0].trim().slice(0, 72)
  return `fix(${findingId}): ${corto}`
}
