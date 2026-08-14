/** Comodines y metacaracteres, en una sola pasada: el orden del patron manda. */
const TOKENS = /\*\*\/|\*\*|\*|\?|[.+^${}()|[\]\\]/g

/**
 * Patron de ruta a expresion regular. Subconjunto deliberado: `**` cruza
 * carpetas, `*` se queda dentro de un segmento, `?` es un caracter. Sin
 * libreria por dos razones que apuntan al mismo sitio: el dominio no tiene
 * dependencias, y este subconjunto cabe en unas lineas.
 *
 * Una sola pasada, no reemplazos encadenados: encadenar obliga a marcadores
 * temporales que luego hay que deshacer, y ese baile es donde se cuelan los
 * errores.
 */
function aRegex(patron: string): RegExp {
  const cuerpo = patron.replace(TOKENS, (token) => {
    if (token === '**/') return '(?:.*/)?'
    if (token === '**') return '.*'
    if (token === '*') return '[^/]*'
    if (token === '?') return '[^/]'
    return `\\${token}`
  })
  return new RegExp(`^${cuerpo}$`)
}

/**
 * true si la ruta encaja con el patron. La ruta se compara COMPLETA desde la
 * raiz del proyecto: un patron que nombra `permission-mode.ts` no encaja con
 * `permission-mode.test.ts`, ni al reves.
 */
export function matchesGlob(path: string, pattern: string): boolean {
  return aRegex(pattern).test(path)
}

/** El primer patron que encaje, o null. Devuelve CUAL, para poder citarlo. */
export function firstMatch(path: string, patterns: readonly string[]): string | null {
  return patterns.find((pattern) => matchesGlob(path, pattern)) ?? null
}
