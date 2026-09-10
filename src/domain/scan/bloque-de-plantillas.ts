import { SIN_GUIA } from './plantilla-ausente'
import { repartirPlantillas, type PlantillasDeParada } from './reparto-de-plantillas'

export type { PlantillasDeParada }

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
 * El bloque de plantillas de una parada, o cadena VACIA si no aplica ninguno.
 *
 * Vacia SOLO cuando no hay nada que decir. Un modulo que no aplica no se
 * nombra —seria ruido sobre lo que no toca— pero uno que aplica y no trae
 * plantilla se confiesa: seguir en silencio dejaria un escaneo sin profundidad
 * indistinguible de uno con ella, y el operador creeria que la tiene.
 *
 * Las plantillas rotas se caen UNA A UNA: que M8 no encaje no puede llevarse
 * por delante el bloque de M9, que esta bien.
 */
export function bloqueDePlantillas(temas: PlantillasDeParada, projectName: string): string {
  const { resumenes, avisos } = repartirPlantillas(temas, projectName)
  if (resumenes.length === 0 && avisos.length === 0) return ''

  const guia = resumenes.length === 0 ? [] : [CABECERA, '', ...resumenes]
  const falta = avisos.length === 0 ? [] : [SIN_GUIA, ...avisos]
  const separador = guia.length > 0 && falta.length > 0 ? [''] : []

  return [...guia, ...separador, ...falta].join('\n')
}
