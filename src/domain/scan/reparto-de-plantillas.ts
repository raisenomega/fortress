import type { ModuloAuditoria } from './modulo-auditoria'
import { razonIlegible, razonSinSembrar } from './plantilla-ausente'
import { resumenDeModulo, type PlantillaDeModulo } from './resumen-de-modulo'

/** Las plantillas que esta parada activa, ya leidas de disco (ADR-083, Fase 2). */
export interface PlantillasDeParada {
  readonly carpeta: string
  /**
   * Los modulos de carpeta que el manifiesto declaro aplicables. Viaja aparte
   * de las plantillas a proposito: la RESTA entre lo que aplica y lo que hay
   * sembrado es justo lo que hay que declarar, y sin la lista de lo pedido esa
   * resta no se puede hacer.
   */
  readonly modulos: readonly ModuloAuditoria[]
  /** Las que estan sembradas. Las que faltan sencillamente no aparecen. */
  readonly plantillas: readonly PlantillaDeModulo[]
}

/** Lo que se puede decir del tema, y lo que hay que confesar que no. */
export interface Reparto {
  readonly resumenes: readonly string[]
  readonly avisos: readonly string[]
}

/**
 * Reparte los modulos que aplican en dos: los que traen bloque y los que no.
 *
 * Ninguno se cae por el camino —cada modulo pedido acaba en un lado o en el
 * otro—, que es la decision 4 de ADR-083 aplicada a las plantillas: lo que no
 * entra se declara, no se calla.
 */
export function repartirPlantillas(temas: PlantillasDeParada, projectName: string): Reparto {
  const resumenes: string[] = []
  const avisos: string[] = []

  for (const modulo of temas.modulos) {
    const plantilla = temas.plantillas.find((p) => p.modulo === modulo)
    if (plantilla === undefined) {
      avisos.push(razonSinSembrar(modulo))
      continue
    }
    const resumen = resumenDeModulo(plantilla, temas.carpeta, projectName)
    if (resumen === null) avisos.push(razonIlegible(modulo))
    else resumenes.push(resumen)
  }

  return { resumenes, avisos }
}
