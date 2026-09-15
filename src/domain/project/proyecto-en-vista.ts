import type { Project } from './project'

/**
 * El proyecto tal como lo ve el renderer: el de la base, mas lo que solo el
 * proceso principal puede calcular, porque mira el disco y git.
 */
export interface ProyectoEnVista extends Project {
  /**
   * El Terminal podria resolver aqui: de confianza, no es el repo propio y hay
   * red git (`terminalPuedeResolver`). NO incluye el modo, que el renderer ya
   * ve; la casilla del lote pide las dos cosas.
   */
  readonly resoluble: boolean
}
