import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import {
  CANONICAL_DOCS,
  CORPUS_DIRS,
  EMPTY_CORPUS,
  categoryOf,
  categoryOfDirectory,
  type CorpusDescriptor,
  type CorpusDoc
} from '@domain/project/corpus-descriptor'
import { readCorpusConfig } from './corpus-config'

function esCarpeta(ruta: string): boolean {
  return existsSync(ruta) && statSync(ruta).isDirectory()
}

function canonicosEnRaiz(projectPath: string): CorpusDoc[] {
  const encontrados: CorpusDoc[] = []
  for (const name of CANONICAL_DOCS) {
    const category = categoryOf(name)
    if (category !== null && existsSync(join(projectPath, name))) {
      encontrados.push({ path: name, category })
    }
  }
  return encontrados
}

/**
 * Un nivel dentro de la carpeta, ni uno mas: ahi es donde un proyecto guarda su
 * arquitectura o su modelo de amenazas. Mirar solo la raiz dejaba fuera el
 * corpus de quien ya lo tenia ordenado en una carpeta —FORTRESS, la primera—.
 */
function dentroDe(base: string, carpeta: string, docs: CorpusDoc[], dirs: string[]): void {
  for (const entry of readdirSync(join(base, carpeta))) {
    const relativa = `${carpeta}/${entry}`
    if (esCarpeta(join(base, relativa))) {
      if (categoryOfDirectory(entry) !== null) dirs.push(`${relativa}/`)
      continue
    }
    const category = categoryOf(entry)
    if (category !== null) docs.push({ path: relativa, category })
  }
}

/**
 * Que documenta este proyecto, mirado en disco. Solo entra lo que existe y se
 * reconoce por su nombre exacto; la carpeta de documentacion se cita por su
 * ruta, sin enumerar lo que no es canonico —cincuenta rutas en cada prompt son
 * ruido caro, y el agente sabe abrir una carpeta que se le nombra—.
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

  const docs = canonicosEnRaiz(projectPath)
  const dirs: string[] = []
  for (const carpeta of CORPUS_DIRS) {
    if (!esCarpeta(join(projectPath, carpeta))) continue
    dirs.push(`${carpeta}/`)
    dentroDe(projectPath, carpeta, docs, dirs)
  }
  return { docs, directories: dirs }
}
