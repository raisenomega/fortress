import { existsSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import type { Alias } from './alias-de-tsconfig'

// Un import omite la extension; se prueban en orden y gana el primero que existe.
const EXTENSIONES = ['.ts', '.tsx', '/index.ts', '/index.tsx']

/**
 * `spec` (un `from '...'`) → ruta REPO-RELATIVA de un `.ts(x)` que existe bajo
 * `root`, o `null` —paquete externo, alias que el proyecto no declara, o fichero
 * inexistente—. Un `null` corta la arista: el grafo no inventa caminos.
 *
 * `base` que empieza por `..` sale del proyecto (un `../../../etc`): se descarta,
 * no se resuelve nada fuera de la raiz auditada.
 */
export function resolverImport(
  root: string,
  aliases: readonly Alias[],
  fromFile: string,
  spec: string
): string | null {
  let base: string | null = null
  if (spec.startsWith('.')) {
    base = normalize(join(dirname(fromFile), spec))
  } else {
    const a = aliases.find((x) => spec.startsWith(x.prefijo))
    if (a !== undefined) base = normalize(a.destino + spec.slice(a.prefijo.length))
  }
  if (base === null || base.startsWith('..')) return null
  const rel = base.replace(/\\/g, '/')
  for (const e of EXTENSIONES) if (existsSync(join(root, rel + e))) return rel + e
  return null
}
