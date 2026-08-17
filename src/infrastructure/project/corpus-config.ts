import { existsSync, readFileSync } from 'fs'
import { basename, join } from 'path'
import {
  categoryOf,
  type CorpusDescriptor,
  type CorpusDoc
} from '@domain/project/corpus-descriptor'
import { FORTRESS_CONFIG } from './fortress-config'

/** Tres estados, como la lectura de la politica: ausente no es lo mismo que roto. */
export type CorpusConfig =
  | { readonly kind: 'not-present' }
  | { readonly kind: 'valid'; readonly corpus: CorpusDescriptor }
  | { readonly kind: 'invalid'; readonly reason: string }

const lista = (raw: unknown): readonly string[] | null =>
  Array.isArray(raw) && raw.every((r) => typeof r === 'string') ? (raw as string[]) : null

/** Un documento declarado se cita aunque no sea canonico; su categoria cae a general. */
const declarado = (path: string): CorpusDoc => ({
  path,
  category: categoryOf(basename(path)) ?? 'general'
})

/**
 * Lee la clave `corpus` del fichero donde el proyecto ya declara lo suyo. Es un
 * lector APARTE del de la politica de integracion a proposito: aquel exige su
 * bloque y da el fichero por invalido si falta, asi que compartir parser haria
 * que un proyecto perdiera su politica por declarar su corpus.
 *
 * Ausente y mal formada son casos distintos: la primera deja mandar al
 * descubrimiento; la segunda es una intencion que no se puede cumplir, y quien
 * la escribio tiene que enterarse.
 */
export function readCorpusConfig(projectPath: string): CorpusConfig {
  const file = join(projectPath, FORTRESS_CONFIG)
  if (!existsSync(file)) return { kind: 'not-present' }

  let raiz: { corpus?: unknown }
  try {
    raiz = JSON.parse(readFileSync(file, 'utf8')) as { corpus?: unknown }
  } catch {
    return { kind: 'invalid', reason: `${file}: no es JSON valido` }
  }

  const corpus = raiz?.corpus
  if (corpus === undefined) return { kind: 'not-present' }
  if (corpus === null || typeof corpus !== 'object') {
    return { kind: 'invalid', reason: 'corpus: objeto con docs y/o directories' }
  }

  const { docs, directories } = corpus as { docs?: unknown; directories?: unknown }
  const rutas = docs === undefined ? [] : lista(docs)
  if (rutas === null) return { kind: 'invalid', reason: 'corpus.docs: lista de rutas' }

  const carpetas = directories === undefined ? [] : lista(directories)
  if (carpetas === null) return { kind: 'invalid', reason: 'corpus.directories: lista de rutas' }

  return { kind: 'valid', corpus: { docs: rutas.map(declarado), directories: carpetas } }
}
