import { NOMBRE_MODULO, type ModuloAuditoria } from './modulo-auditoria'
import { cuerpoAccionable } from './plantilla-accionable'
import { sustituirHuecos } from './plantilla-placeholders'

/**
 * Donde mira una pasada, en sus dos caras. La RUTA rellena los huecos de
 * carpeta —de ahi sale el `grep`— y el NOMBRE es como se lee en el encabezado.
 * Coinciden en una parada de carpeta y NO en una de tema: su grep sale de la
 * raiz, pero decir «en .» seria contar mal lo que se esta haciendo.
 */
export interface AlcanceDePasada {
  readonly ruta: string
  readonly nombre: string
}

/** Una plantilla del kit tal y como esta en disco, con el modulo del que es. */
export interface PlantillaDeModulo {
  readonly modulo: ModuloAuditoria
  /** El `.md` CRUDO. Resumir es trabajo del dominio; leer, de quien tiene disco. */
  readonly texto: string
}

/**
 * El bloque accionable de UN modulo para UNA parada: la seccion 3 de su
 * plantilla, podada y con los huecos rellenos, bajo un encabezado de FORTRESS.
 *
 * El encabezado lo pone la casa y no la plantilla, por lo mismo que se poda su
 * primer parrafo: quien anuncia lo que el agente va a hacer es el prompt que lo
 * manda, con su propio vocabulario (`NOMBRE_MODULO`, de la Fase 1).
 *
 * null si la plantilla no encaja con el contrato. Sin bloque es mejor que un
 * bloque a medias: media checklist tematica se lee como la checklist entera.
 */
export function resumenDeModulo(
  plantilla: PlantillaDeModulo,
  alcance: AlcanceDePasada,
  projectName: string
): string | null {
  const cuerpo = cuerpoAccionable(plantilla.texto)
  if (cuerpo === null) return null

  const titulo = `${plantilla.modulo} ${NOMBRE_MODULO[plantilla.modulo]} — en ${alcance.nombre}:`
  return `${titulo}\n${sustituirHuecos(cuerpo, alcance.ruta, projectName)}`
}
