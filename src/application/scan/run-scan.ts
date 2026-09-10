import type { Manifiesto } from '@domain/scan/manifiesto'
import type { Scanner } from '@domain/scan/scanner'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { persistScan } from './persist-scan'
import type { ProgresoDelRecorrido } from './progreso-del-recorrido'
import { recorrerParadas, type RecorridoDeps } from './recorrer-paradas'
import type { ScanSummary } from './scan-types'

const NO_SCANNER =
  'Para escanear hace falta Claude Code: es quien lee el codigo del proyecto. ' +
  'Instalalo con npm install -g @anthropic-ai/claude-code.'

/**
 * Lo que el escaneo necesita de fuera. `medir` viaja inyectado como el
 * `scanner` —es git, o sea I/O— en vez de colgar de `AppContext`: el mapa de
 * puertos no crece por una funcion que solo usa este caso de uso.
 *
 * Hereda `cancelado` de `RecorridoDeps` y NO anade topes. El recorrido sigue
 * llevando solo eso (ADR-082, Enmienda 2).
 */
export interface ScanDeps extends RecorridoDeps {
  readonly medir: (projectPath: string) => Promise<Manifiesto>
}

/**
 * Escanea un proyecto. Mide primero y despues decide como recorrerlo (ADR-082).
 *
 * Con UNA parada —o con ninguna, que es un proyecto sin fuente versionada— va
 * por el camino de siempre: una pasada al arbol entero. No es un atajo: el
 * recorrido de una parada Y el escaneo monolitico son la misma cosa, y hacerlo
 * explicito deja probar que partir no cambio el resultado.
 *
 * Con VARIAS, el recorrido: una pasada por carpeta, guardando cada una.
 */
export async function runScan(
  context: AppContext,
  scanner: Scanner,
  projectId: string,
  progreso: ProgresoDelRecorrido,
  deps: ScanDeps
): Promise<Result<ScanSummary>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  if (!scanner.isAvailable()) return err(NO_SCANNER)

  // Antes de arrancar nada: una carpeta que ya no existe da un error del
  // proceso hijo que parece un problema de instalacion y no lo es.
  const problem = scanner.precheck(project.path)
  if (problem) return err(problem)

  const manifiesto = await deps.medir(project.path)
  if (manifiesto.paradas.length > 1) {
    return recorrerParadas(context, scanner, project, manifiesto, progreso, deps)
  }

  const outcome = await scanner.scan(
    { projectPath: project.path, projectName: project.name, projectId: project.id },
    progreso.texto
  )
  if (!outcome.ok) return err(outcome.error)

  return ok(await persistScan(context, project, outcome.value))
}
