import type { DeclaracionDeModulos } from '@domain/scan/declaracion-de-modulos'
import type { Manifiesto } from '@domain/scan/manifiesto'
import type { Scanner } from '@domain/scan/scanner'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { asentarNotas } from '../system/asentar-notas'
import { persistScan } from './persist-scan'
import type { SalidasDelRecorrido } from './progreso-del-recorrido'
import { recorrerParadas } from './recorrer-paradas'
import type { RecorridoDeps } from './recorrido-deps'
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
  readonly medir: (path: string, declaracion: DeclaracionDeModulos) => Promise<Manifiesto>
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
  salidas: SalidasDelRecorrido,
  deps: ScanDeps
): Promise<Result<ScanSummary>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  if (!scanner.isAvailable()) return err(NO_SCANNER)

  // Antes de arrancar nada: una carpeta que ya no existe da un error del
  // proceso hijo que parece un problema de instalacion y no lo es.
  const problem = scanner.precheck(project.path)
  if (problem) return err(problem)

  // La declaracion viaja con el proyecto, no con la ruta: `medir` conoce una
  // carpeta y quien sabe lo que el operador declaro es la fila (ADR-083).
  const manifiesto = await deps.medir(project.path, project.modulosDeclarados)
  if (manifiesto.paradas.length > 1) {
    return recorrerParadas(context, scanner, project, manifiesto, salidas, deps)
  }

  const outcome = await scanner.scan(
    { projectPath: project.path, projectName: project.name, projectId: project.id },
    salidas.progreso.texto
  )
  if (!outcome.ok) return err(outcome.error)

  // El camino de UNA parada observa igual que el recorrido: son la misma cosa
  // con N=1, y dejarlo fuera haria que un proyecto pequeno no ensenara nada.
  asentarNotas(context, project, outcome.value.notas)
  return ok(await persistScan(context, project, outcome.value, salidas.scanLog))
}
