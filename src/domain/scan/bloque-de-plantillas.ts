import { resumenDeModulo, type PlantillaDeModulo } from './resumen-de-modulo'

/**
 * Lo que la campana ANADE a esta parada, encima de la checklist de siempre. El
 * ADR lo dice al derecho: las plantillas refuerzan el escaneo, no lo
 * sustituyen. Por eso el bloque entra DESPUES de la checklist y anuncia que es
 * profundidad tematica, no un contrato de salida nuevo.
 */
const CABECERA = [
  'Ademas, esta carpeta activa modulos de la campana de auditoria. Son',
  'profundidad TEMATICA sobre lo anterior, no un reemplazo: los hallazgos se',
  'reportan igual, con el mismo contrato y los mismos ejes.'
].join('\n')

/**
 * El bloque de plantillas de una parada, o cadena VACIA si no hay ninguno.
 *
 * Cadena vacia y no un aviso, molde `buildDocsFirst`: quien la recibe no
 * escribe el bloque, y asi un proyecto sin plantillas sembradas compone el
 * mismo prompt que componia ayer. Callar es honesto; lo que no seria honesto es
 * anunciar profundidad tematica y no traer ninguna.
 *
 * Las plantillas que no encajan con el contrato se caen una a una: que M8 este
 * corrupta no puede llevarse por delante el bloque de M9, que si esta bien.
 */
export function bloqueDePlantillas(
  plantillas: readonly PlantillaDeModulo[],
  carpeta: string,
  projectName: string
): string {
  const resumenes = plantillas
    .map((plantilla) => resumenDeModulo(plantilla, carpeta, projectName))
    .filter((resumen): resumen is string => resumen !== null)

  if (resumenes.length === 0) return ''

  return [CABECERA, '', ...resumenes].join('\n')
}
