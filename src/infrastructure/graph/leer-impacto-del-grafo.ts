import { GRAPH_BIN } from '@domain/connectors/graph-mcp'
import type { ImpactoDeHallazgo } from '@domain/build/marco-de-impacto'
import type { Finding } from '@domain/project/finding'
import { correrCliGrafo } from './correr-cli-grafo'
import { filasDeQuery, parseTrace } from './impacto-crudo'

/** `file:line` -> UNA funcion del grafo (qualified_name); 0 o >1 filas -> null:
 *  ante la ambiguedad se OMITE, jamas se traza la que no es (fail-safe). */
async function resolverFuncion(
  dir: string,
  slug: string,
  f: Finding,
  owner: string
): Promise<string | null> {
  if (f.line === null) return null
  const query = `MATCH (fn:Function) WHERE fn.file_path = ${JSON.stringify(f.file)} AND fn.start_line <= ${f.line} AND fn.end_line >= ${f.line} RETURN fn.qualified_name` // prettier-ignore
  const salida = await correrCliGrafo(GRAPH_BIN, dir, 'query_graph', { project: slug, query }, owner) // prettier-ignore
  const filas = salida === null ? [] : filasDeQuery(salida)
  return filas.length === 1 ? filas[0] : null
}

async function impactoDeUno(
  dir: string,
  slug: string,
  f: Finding,
  owner: string
): Promise<ImpactoDeHallazgo | null> {
  const fn = await resolverFuncion(dir, slug, f, owner)
  if (fn === null) return null
  const args = { project: slug, function_name: fn }
  const salida = await correrCliGrafo(GRAPH_BIN, dir, 'trace_path', args, owner)
  const traza = salida === null ? null : parseTrace(salida)
  if (traza === null) return null
  return { severity: f.severity, file: f.file, line: f.line, title: f.title, ...traza }
}

/**
 * El radio de impacto de los hallazgos (ya seleccionados top CRITICAL/HIGH),
 * DENTRO del fence del turno (`dir`, 1 .db), en paralelo. Reusa el fence: NO
 * llama a prepararGrafoDelTurno ni abre un 2o .db. Omite los que no resuelven.
 */
export async function impactoSobreFence(
  dir: string,
  slug: string,
  owner: string,
  hallazgos: readonly Finding[]
): Promise<readonly ImpactoDeHallazgo[]> {
  const todos = await Promise.all(hallazgos.map((f) => impactoDeUno(dir, slug, f, owner)))
  return todos.filter((i): i is ImpactoDeHallazgo => i !== null)
}
