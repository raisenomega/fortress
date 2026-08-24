import { ILEGIBLE } from '@domain/repair/analysis-ilegible'
import { leerEvidencia } from '@domain/repair/leer-evidencia'
import { tail } from '@domain/repair/tail'
import { trabajoReal } from '@domain/repair/budget'
import type { TokenUsage } from '@domain/telemetry/token-usage'
import type { Analysis } from '@domain/repair/analysis'
import type { Candidate } from '@domain/repair/select-target'
import { toSelfNotes } from '@domain/system/self-note-item'

/** Lo que devuelve la corrida headless: el texto y la factura entera. */
export interface RunOut {
  readonly result: string
  /** Ausente si el CLI no dejo factura legible. No se sustituye por ceros. */
  readonly usage?: TokenUsage
}

/** Cuanto del texto ilegible se guarda: bastante para reconocer que devolvio
 *  el analista, poco para no llenar el libro con una respuesta entera. */
const MUESTRA = 300

/** Lo leido, o null si no habia JSON que leer o el que habia no se deja leer. */
function leer(texto: string): Record<string, unknown> | null {
  const match = texto.match(/\{[\s\S]*\}/)
  if (match === null) return null
  try {
    return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Extrae el Analysis del JSON que el analista deja en su respuesta.
 *
 * El barrido es codicioso —del primer `{` al ultimo `}`— y por eso la respuesta
 * tiene que traer UN solo objeto. Las auto-observaciones viajan como una clave
 * mas dentro de el: un bloque aparte con su propio JSON haria que este barrido
 * se tragara los dos.
 *
 * Y si aun asi lo que llega no se deja leer, el analisis sale DESCONOCIDO con
 * una muestra del texto: no accionable, luego la propuesta caduca y el ciclo
 * sigue con la siguiente. Antes la excepcion subia hasta matar la sesion entera,
 * y el texto que la causo no quedaba en ningun sitio — la unica forma de saber
 * que habia devuelto el analista era volver a ejecutarlo y esperar suerte.
 */
export function toAnalysis(target: Candidate, out: RunOut): Analysis {
  const leido = leer(out.result)
  const j = leido ?? {}
  const text = (k: string): string => (typeof j[k] === 'string' ? j[k] : '').trim()
  // `risk` es el canal: plan-repair lo persiste como analysisReason y el libro
  // lo asienta como razon de la transicion. La muestra viaja por ahi sola.
  // La COLA, no la cabeza: el fallo tipico es "contenido extra despues del
  // JSON", asi que lo que sobra esta al final y el principio se parece siempre
  // al de una respuesta buena. Guardar el prefijo dejo sin diagnosticar el
  // primer caso real (18-ago); es el mismo `tail` que el gate usa para su
  // autopsia, que ademas corta en salto de linea para no empezar a medias.
  const ilegible = tail(out.result.trim(), MUESTRA)
  const notes = toSelfNotes(j.notes)
  // Lo que no se entiende no viaja a medias: sin evidencia legible el OBSOLETO
  // no puede extinguir. Un `status` ausente o torcido cae en OBSOLETO como
  // siempre, pero ya no mata nada, porque tampoco trae con que probarlo.
  const evidencia = leerEvidencia(j.evidencia)
  return {
    target,
    status: leido === null ? 'DESCONOCIDO' : text('status') || 'DESCONOCIDO',
    ...(evidencia === undefined ? {} : { evidencia }),
    whatToChange: text('whatToChange'),
    where: text('where'),
    patternToCopy: text('patternToCopy'),
    doNotTouch: text('doNotTouch'),
    risk: leido === null ? `${ILEGIBLE}${ilegible}` : text('risk'),
    tokensUsed: out.usage === undefined ? 0 : trabajoReal(out.usage),
    ...(notes.length > 0 ? { notes } : {})
  }
}
