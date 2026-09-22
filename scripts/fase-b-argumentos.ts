export interface Argumentos {
  readonly proyecto: string
  /** Ruta de la base, o null si no se dio: quien la necesite decide que hacer. */
  readonly base: string | null
}

/**
 * `<proyecto> [--base <ruta>]`. El proyecto NO tiene defecto: fundir el proyecto
 * equivocado por olvidar un parametro es justo lo que no puede pasar. Y la base
 * tampoco: la de la operadora solo se toca cuando se nombra a proposito.
 */
export function leerArgumentos(argv: readonly string[]): Argumentos {
  const proyecto = argv[0]
  if (proyecto === undefined || proyecto.startsWith('--')) {
    throw new Error('Falta el proyecto: <proyecto> [--base <ruta-de-la-base>]')
  }
  const i = argv.indexOf('--base')
  const base = i === -1 ? null : (argv[i + 1] ?? null)
  if (i !== -1 && base === null) throw new Error('--base sin ruta')
  return { proyecto, base }
}
