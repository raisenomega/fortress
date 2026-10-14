import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { aliasDelProyecto, type Alias } from './alias-de-tsconfig'
import { resolverImport } from './resolver-de-import'

/**
 * Cap de saltos del BFS: la cadena mas larga MEDIDA entre ancla y control es 2
 * (cobaya 5075c498: handler → run-gate → gate-guards; cobaya 1 es 1) + 1 margen.
 * Mas hondo infla el cierre (depth2=73, depth3=232) sin pescar controles reales,
 * y el decoy `install-graph` queda fuera a cualquier profundidad.
 */
const CAP_DE_SALTOS = 3

// `from '...'`, `import '...'` (efecto) e `import('...')` (dinamico). Global para matchAll.
const IMPORT = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g

const memoDeps = new Map<string, readonly string[]>()
const memoAlias = new Map<string, readonly Alias[]>()

/** Vacia la cache del grafo. Se llama al EMPEZAR una corrida de verify: cacheado
 *  POR CORRIDA (no por hallazgo), pero sin sobrevivir a un arbol que cambio. */
export function olvidarImports(): void {
  memoDeps.clear()
  memoAlias.clear()
}

function aliasCache(root: string): readonly Alias[] {
  const hit = memoAlias.get(root)
  if (hit !== undefined) return hit
  const a = aliasDelProyecto(root)
  memoAlias.set(root, a)
  return a
}

/** Las importaciones (repo-relativas, bajo `src`) de `file`, cacheadas. La clave
 *  lleva el `root`: dos proyectos distintos tienen distinto `src/x.ts`. */
function importsDe(root: string, file: string): readonly string[] {
  const clave = `${root}\u0000${file}`
  const hit = memoDeps.get(clave)
  if (hit !== undefined) return hit
  let txt = ''
  try {
    txt = readFileSync(join(root, file), 'utf8')
  } catch {
    txt = ''
  }
  const aliases = aliasCache(root)
  const out: string[] = []
  for (const m of txt.matchAll(IMPORT)) {
    const r = m[1] === undefined ? null : resolverImport(root, aliases, file, m[1])
    if (r !== null && !out.includes(r)) out.push(r)
  }
  memoDeps.set(clave, out)
  return out
}

/** true si el cierre de imports de `desde` (BFS, `CAP_DE_SALTOS`) contiene `hasta`. */
export function alcanza(root: string, desde: string, hasta: string): boolean {
  if (desde === hasta) return true
  const vistos = new Set([desde])
  let frontera = [desde]
  for (let d = 0; d < CAP_DE_SALTOS && frontera.length > 0; d++) {
    const siguiente: string[] = []
    for (const f of frontera)
      for (const dep of importsDe(root, f)) {
        if (dep === hasta) return true
        if (!vistos.has(dep)) {
          vistos.add(dep)
          siguiente.push(dep)
        }
      }
    frontera = siguiente
  }
  return false
}
