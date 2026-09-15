import type { ProyectoEnVista } from '@domain/project/proyecto-en-vista'
import { terminalPuedeResolver } from '@domain/settings/terminal-puede-resolver'
import type { AppContext } from '../context'
import { listProjects } from './list-projects'

/** Las dos sondas del disco que la aplicacion no lanza: las pone la infraestructura. */
export interface SondasDelProyecto {
  readonly esRepoPropio: (path: string) => boolean
  readonly redGit: (path: string) => boolean
}

/**
 * La lista de proyectos para el renderer, con `resoluble` ya calculado.
 *
 * Va aqui y no en el renderer porque el renderer no puede mirar ni el
 * package.json ni git: con solo `trusted` delante, el propio repo de FORTRESS
 * —que es de confianza— habria ofrecido el lote del Terminal, que alli degrada a
 * supervisado. Las sondas son las mismas con las que `chat:send` decide el modo.
 */
export function proyectosEnVista(
  context: AppContext,
  sondas: SondasDelProyecto
): readonly ProyectoEnVista[] {
  return listProjects(context).map((project) => ({
    ...project,
    resoluble: terminalPuedeResolver({
      project,
      selfRepo: sondas.esRepoPropio(project.path),
      redGit: sondas.redGit(project.path)
    })
  }))
}
