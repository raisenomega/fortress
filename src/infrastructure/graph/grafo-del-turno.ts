import Database from 'better-sqlite3'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { basename, join } from 'node:path'
import { graphSlug } from '@domain/graph/graph-slug'
import { raizDeGrafosDeTurno } from './raiz-de-grafos-de-turno'
import { CACHE_REAL_DEL_GRAFO } from './read-graph-index'

/** El store del grafo de UN turno: un directorio con la copia del proyecto, o vacio. */
export interface GrafoDelTurno {
  readonly dir: string
  liberar(): void
}

/** Lo que un lanzador del agente sabe pedir: su grafo, ya atado al proyecto. */
export interface GrafoDelTurnoPort {
  preparar(): Promise<GrafoDelTurno>
}

/**
 * La pared de ADR-095 (enmienda): el servidor del grafo de un turno de clase A
 * solo alcanza ESTE directorio (`CBM_CACHE_DIR`), y dentro hay UNA copia del
 * `.db` del proyecto, con su nombre para que el servidor lo encuentre por
 * nombre. Copia REAL por la API de backup de SQLite —consistente aunque haya un
 * escritor— y nunca un enlace duro, que comparte inodo: lo que el vigilante del
 * servidor reescribiera llegaria al original. Sin `.db`, el directorio nace
 * vacio y el turno corre sin grafo, como hoy cuando falta el indice (ADR-104).
 */
export async function prepararGrafoDelTurno(
  projectPath: string | null,
  raiz: string = raizDeGrafosDeTurno(),
  cacheReal: string = CACHE_REAL_DEL_GRAFO
): Promise<GrafoDelTurno> {
  mkdirSync(raiz, { recursive: true })
  const dir = mkdtempSync(join(raiz, 'turno-'))
  const origen = projectPath === null ? null : join(cacheReal, `${graphSlug(projectPath)}.db`)
  if (origen !== null && existsSync(origen)) await copiaReal(origen, join(dir, basename(origen)))
  return { dir, liberar: () => liberarDir(dir) }
}

/**
 * Borrar el directorio del turno sin reventar el turno. El servidor deja dentro
 * su `_config.db` y sus `logs/`, y puede seguir escribiendolos unos cientos de
 * milisegundos despues de que el CLI cierre (medido: ENOTEMPTY en la prueba
 * dura): se reintenta con espera, y si aun asi queda algo, lo barre el arranque.
 */
function liberarDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
  } catch (error) {
    console.warn('[grafo-por-turno] no se pudo liberar', dir, error instanceof Error ? error.message : error) // prettier-ignore
  }
}

async function copiaReal(origen: string, destino: string): Promise<void> {
  const db = new Database(origen, { readonly: true, fileMustExist: true })
  try {
    await db.backup(destino)
  } finally {
    db.close()
  }
}

/** Lo que un cierre abrupto dejo bajo la raiz: se barre al arrancar, como los worktrees. */
export function barrerGrafosDeTurnos(raiz: string): number {
  if (!existsSync(raiz)) return 0
  const restos = readdirSync(raiz)
  for (const r of restos) rmSync(join(raiz, r), { recursive: true, force: true })
  return restos.length
}

/** El puerto atado a un proyecto (`null` = sin copia: un directorio vacio, nunca la cache real). */
export function grafoDelTurnoDe(projectPath: string | null): GrafoDelTurnoPort {
  return { preparar: () => prepararGrafoDelTurno(projectPath) }
}
