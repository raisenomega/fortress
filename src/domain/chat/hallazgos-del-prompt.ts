/** Lo que el turno sabe de hallazgos: la lista breve, y el bloque del que se
 *  resuelve si lo hay. Sale de `chat-prompt` por el limite de 75 lineas. */
export interface HallazgosDelTurno {
  readonly known: readonly string[]
  /** El bloque del hallazgo que este turno resuelve, ya saneado (ADR-088). */
  readonly enFoco?: string
  /** `known` son los hallazgos del LOTE, no el historial del escaneo. */
  readonly deLote?: boolean
}

const VIEJOS = 'Hallazgos ya registrados de escaneos anteriores:'
const DEL_LOTE = 'Los hallazgos del lote que el operador quiere resolver:'
const FOCO = 'Hallazgo a resolver (lo mando el operador desde su fila del Escaneo):'
const HERMANOS =
  'Otros hallazgos del MISMO lote, solo como contexto: NO los resuelvas en este turno.'

const lista = (titulo: string, known: readonly string[]): string =>
  [titulo, ...known.map((k) => `- ${k}`)].join('\n')

function sinFoco(ctx: HallazgosDelTurno): string {
  if (ctx.deLote === true) return lista(DEL_LOTE, ctx.known)
  if (ctx.known.length === 0) return 'FORTRESS no tiene escaneos previos de este proyecto.'
  return lista(VIEJOS, ctx.known)
}

/**
 * Con un hallazgo a resolver, SU bloque en vez de la lista: el turno es de ese.
 * Y si viene de un lote, detras van sus hermanos en una linea cada uno —para que
 * el productor no repita el mismo patron cinco veces— dicho de forma que no
 * invite a resolverlos: el foco sigue siendo UNO (ADR-088, pieza 2).
 */
export function hallazgosDelTurno(ctx: HallazgosDelTurno): string {
  if (ctx.enFoco === undefined) return sinFoco(ctx)
  if (ctx.known.length === 0) return [FOCO, ctx.enFoco].join('\n')
  return [FOCO, ctx.enFoco, '', lista(HERMANOS, ctx.known)].join('\n')
}
