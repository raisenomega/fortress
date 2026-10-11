import type { EfectoDelModo } from '@domain/settings/causa-de-degradacion'
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
  /**
   * Si ES el repo de FORTRESS. Viaja porque el renderer no puede mirar el
   * package.json ni git, y de eso depende QUE HERRAMIENTA le toca (ADR-107): el
   * Motor repara FORTRESS, y a un proyecto de cliente se le dice que su camino
   * es el Terminal en vez de ensenarle un boton que su guarda va a negar.
   */
  readonly esRepoPropio: boolean
  /**
   * El EFECTO del toggle app-wide sobre ESTE proyecto (PASO 152): modo efectivo
   * + causa de degradacion por categoria. Lo pinta el encabezado del Chat; el
   * renderer no puede calcularlo porque el modo efectivo degrada mirando git.
   */
  readonly efecto: EfectoDelModo
}
