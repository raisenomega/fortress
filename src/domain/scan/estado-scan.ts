/**
 * En que punto esta un escaneo. Vocabulario CERRADO, como los tipos de defecto
 * (ADR-081) y los ejes de severidad (ADR-080): la columna guarda una de estas
 * tres palabras y ninguna otra.
 *
 * Existe porque el escaneo por paradas (ADR-082) parte el cierre en dos: una
 * fila nace ABIERTA con score provisional y se cierra despues con el definitivo.
 * Sin este eje, un score a medias seria indistinguible de uno final.
 */
export const ESTADOS_SCAN = ['ABIERTO', 'CERRADO', 'ABORTADO'] as const

export type EstadoScan = (typeof ESTADOS_SCAN)[number]

/** Como termino un recorrido: entero, o cortado a medias. Nunca ABIERTO. */
export type EstadoFinal = Exclude<EstadoScan, 'ABIERTO'>

/**
 * Fuera del vocabulario no se adivina: cae a `CERRADO`, como `aTipoDeDefecto`
 * cae a `otro`.
 *
 * `CERRADO` es el centinela por lo mismo que es el default de la migracion: las
 * filas que ya existian son escaneos terminados. Y es el lado seguro al leer —
 * llamar ABIERTA a una fila que no lo es la deja esperando un cierre que nunca
 * va a llegar, y el tablero mostrandola en curso para siempre.
 */
export function aEstadoScan(value: unknown): EstadoScan {
  return (ESTADOS_SCAN as readonly string[]).includes(value as string)
    ? (value as EstadoScan)
    : 'CERRADO'
}
