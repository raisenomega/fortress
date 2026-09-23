export const ARREGLO_FUERA_DE_CORREA = 'arreglo_fuera_de_correa'

/**
 * El motivo persistido lleva el fichero que no cabia y la HUELLA del terreno
 * declarado (`cfg=`), porque es la huella —no el HEAD— lo que levanta la pausa
 * (ADR-102 §4): el arbol de FORTRESS cambia a diario y la correa no. Va en el
 * sufijo del motivo, como `gate_failed_at=` o `superseded_by=`, para que quien
 * elige de la cola lo lea de la fila sin abrir el Libro.
 */
export function motivoDelArreglo(file: string, huella: string): string {
  return `${ARREGLO_FUERA_DE_CORREA}: ${file} cfg=${huella}`
}

/** La huella del motivo, o null si el motivo no es de esta causa o no la trae. */
export function huellaDelMotivo(motivo: string | null | undefined): string | null {
  if (motivo == null || !motivo.startsWith(`${ARREGLO_FUERA_DE_CORREA}:`)) return null
  const huella = / cfg=(\S+)$/.exec(motivo)
  return huella === null ? null : huella[1]
}
