import { totalTokens, type TokenUsage } from '@domain/telemetry/token-usage'
import type { Analysis } from '@domain/repair/analysis'
import type { Candidate } from '@domain/repair/select-target'
import { toSelfNotes } from '@domain/system/self-note-item'

/** Lo que devuelve la corrida headless: el texto y la factura entera. */
export interface RunOut {
  readonly result: string
  readonly usage: TokenUsage
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
  const ilegible = out.result.trim().slice(0, MUESTRA)
  const notes = toSelfNotes(j.notes)
  return {
    target,
    status: leido === null ? 'DESCONOCIDO' : text('status') || 'DESCONOCIDO',
    whatToChange: text('whatToChange'),
    where: text('where'),
    patternToCopy: text('patternToCopy'),
    doNotTouch: text('doNotTouch'),
    risk: leido === null ? `analisis ilegible: ${ilegible}` : text('risk'),
    tokensUsed: totalTokens(out.usage),
    ...(notes.length > 0 ? { notes } : {})
  }
}
