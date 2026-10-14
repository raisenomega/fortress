import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Un alias de modulo: `@domain/` → `src/domain/` (el `*` ya recortado). */
export interface Alias {
  readonly prefijo: string
  readonly destino: string
}

// Donde los proyectos declaran `compilerOptions.paths`. FORTRESS los parte en
// node/web; otros usan el raiz o `base`/`app`. Lo que no exista, no entra.
const TSCONFIGS = ['tsconfig.json', 'tsconfig.node.json', 'tsconfig.web.json', 'tsconfig.app.json', 'tsconfig.base.json'] // prettier-ignore

/** Parse tolerante: un tsconfig lleva comentarios y comas colgantes que
 *  `JSON.parse` no traga. `[^:]//` evita comerse un `https://` de un valor. */
function aJson(
  txt: string
): { compilerOptions?: { paths?: Record<string, readonly string[]> } } | null {
  const limpio = txt
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/,(\s*[}\]])/g, '$1')
  try {
    return JSON.parse(limpio) as { compilerOptions?: { paths?: Record<string, readonly string[]> } }
  } catch {
    return null
  }
}

/**
 * Los alias (`@x/* → ruta/*`) que el PROYECTO AUDITADO declara en sus tsconfig.
 * Vacio si no hay ninguno: el resolver cae entonces a solo-relativo, que es
 * universal y conservador (un alias ajeno no resuelve → no se sigue la arista).
 */
export function aliasDelProyecto(root: string): readonly Alias[] {
  const out: Alias[] = []
  for (const f of TSCONFIGS) {
    let paths: Record<string, readonly string[]> | undefined
    try {
      paths = aJson(readFileSync(join(root, f), 'utf8'))?.compilerOptions?.paths
    } catch {
      paths = undefined
    }
    for (const [clave, valor] of Object.entries(paths ?? {})) {
      const destino = valor[0]
      if (clave.endsWith('/*') && destino?.endsWith('/*')) {
        out.push({ prefijo: clave.slice(0, -1), destino: destino.slice(0, -1) })
      }
    }
  }
  return out
}
