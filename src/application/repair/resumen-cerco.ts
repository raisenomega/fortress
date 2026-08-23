import { puedeAutoIntegrarse, puedeTrabajarse } from '@domain/repair/alcance'
import type { AppContext } from '../context'
import { vivo } from './elegir-objetivo'

/**
 * Los hallazgos vivos, y de ellos los dos subconjuntos que el operador necesita
 * distinguir: los que el motor puede TRABAJAR dejandolos a firma, y los que
 * ademas podrian AUTO-INTEGRARSE dentro del cerco. Un solo numero mezclaba las
 * dos cosas y decia "25 fuera del cerco" cuando el motor podia con veinte.
 */
export interface ResumenCerco {
  readonly total: number
  readonly trabajables: number
  readonly autoIntegrables: number
}

const VACIO: ResumenCerco = { total: 0, trabajables: 0, autoIntegrables: 0 }

/**
 * Lo que el freno de la seleccion deja fuera, en numero.
 *
 * Existe porque el freno es MUDO: un hallazgo fuera de alcance no sale elegido
 * y ya esta, sin rastro. Sin este contador el operador ve un motor que ignora
 * parte de su tablero y no tiene forma de saber por que —ni de saber que la via
 * dirigida sigue abierta—. Un freno silencioso se confunde con una averia.
 */
export function resumenCerco(context: AppContext, projectId: string): ResumenCerco {
  const project = context.projects.findById(projectId)
  if (project === null) return VACIO

  const config = context.fortressConfig(project.path)
  const vivos = context.findings.listMemory(projectId).filter(vivo)
  return {
    total: vivos.length,
    trabajables: vivos.filter((f) => puedeTrabajarse(f.file)).length,
    autoIntegrables: vivos.filter((f) => puedeAutoIntegrarse(f.severity, f.file, config)).length
  }
}
