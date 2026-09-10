/**
 * Que ensena el gauge, decidido aparte de como se dibuja.
 *
 * La regla es de `scan-status`: un numero que no significa nada NO se muestra.
 * Sin escaneo previo el 0 es «desconocido», no «malo», y por eso ahi se pinta
 * un guion. Mientras un recorrido CORRE pasa lo mismo por otra razon: el score
 * de `projects` es el ANTERIOR —`updateScan` vive en el cierre—, o sea un
 * numero real pero viejo. Ensenar «86 verde» mientras se esta descubriendo un
 * CRITICAL no es un retraso de refresco: es afirmar tranquilidad justo cuando
 * no se sabe. El verde se gana al terminar (ADR-082).
 */
export type LoQueEnsena = 'score' | 'sin-escanear' | 'en-curso'

export const EN_CURSO_LABEL = 'En progreso'

/** El recorrido manda sobre todo lo demas: si corre, no hay nota que leer. */
export function loQueEnsena(scanned: boolean, enCurso: boolean): LoQueEnsena {
  if (enCurso) return 'en-curso'
  return scanned ? 'score' : 'sin-escanear'
}

/** El arco solo se llena cuando el numero significa algo. */
export const arcoLleno = (ensena: LoQueEnsena): boolean => ensena === 'score'
