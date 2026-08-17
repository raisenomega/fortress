import { existsSync, statSync } from 'fs'
import { join } from 'path'
import {
  CANONICAL_DOCS,
  CORPUS_DIRS,
  EMPTY_CORPUS,
  categoryOf,
  type CorpusDescriptor,
  type CorpusDoc
} from '@domain/project/corpus-descriptor'
import { readCorpusConfig } from './corpus-config'

function esCarpeta(base: string, name: string): boolean {
  const ruta = join(base, name)
  return existsSync(ruta) && statSync(ruta).isDirectory()
}

function canonicosEnRaiz(projectPath: string): readonly CorpusDoc[] {
  const encontrados: CorpusDoc[] = []
  for (const name of CANONICAL_DOCS) {
    const category = categoryOf(name)
    if (category === null) continue
    if (existsSync(join(projectPath, name))) encontrados.push({ path: name, category })
  }
  return encontrados
}

/**
 * Que documenta este proyecto, mirado en disco. Solo entra lo que existe: los
 * canonicos por su nombre exacto, y las carpetas de documentacion por su ruta,
 * sin enumerar dentro —cincuenta rutas en cada prompt son ruido caro, y el
 * agente sabe abrir una carpeta que se le nombra—.
 *
 * Si el proyecto declara su corpus, su declaracion SUSTITUYE a lo descubierto
 * entero: quien declara sabe mejor donde tiene su doctrina. Una declaracion
 * ilegible no inventa nada — se cae al descubrimiento, y avisar de que esta
 * rota es trabajo del diagnostico, no de esta lectura.
 */
export function discoverCorpus(projectPath: string): CorpusDescriptor {
  if (!existsSync(projectPath)) return EMPTY_CORPUS

  const declarado = readCorpusConfig(projectPath)
  if (declarado.kind === 'valid') return declarado.corpus

  return {
    docs: canonicosEnRaiz(projectPath),
    directories: CORPUS_DIRS.filter((name) => esCarpeta(projectPath, name)).map((n) => `${n}/`)
  }
}
