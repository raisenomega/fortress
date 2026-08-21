import { puedeAspirar } from '@domain/repair/puede-aspirar'
import type { AppContext } from '../context'
import { vivo } from './elegir-objetivo'

/** Cuantos hallazgos vivos hay y cuantos no puede elegir la cola por si sola. */
export interface ResumenCerco {
  readonly total: number
  readonly fuera: number
}

const VACIO: ResumenCerco = { total: 0, fuera: 0 }

/**
 * Lo que el freno de la seleccion deja fuera, en numero.
 *
 * Existe porque el freno es MUDO: un hallazgo que no puede aspirar al cerco no
 * sale elegido y ya esta, sin rastro. Sin este contador el operador ve un motor
 * que ignora casi todo su tablero y no tiene forma de saber por que —ni de
 * saber que la via dirigida sigue abierta—. Un freno silencioso se confunde con
 * una averia.
 */
export function resumenCerco(context: AppContext, projectId: string): ResumenCerco {
  const project = context.projects.findById(projectId)
  if (project === null) return VACIO

  const config = context.fortressConfig(project.path)
  const vivos = context.findings.listMemory(projectId).filter(vivo)
  return {
    total: vivos.length,
    fuera: vivos.filter((f) => !puedeAspirar(f.severity, f.file, config)).length
  }
}
