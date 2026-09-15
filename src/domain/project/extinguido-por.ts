/**
 * QUIEN cerro un hallazgo, aparte de POR QUE (`MotivoExtincion`).
 *
 * Son dos preguntas distintas y por eso son dos columnas, igual que en el cierre
 * de una observacion `attended_by` vive aparte de `reason`. `juicio_obsoleto`
 * dice que un agente miro el fichero y encontro el marcador, y eso es
 * exactamente lo mismo lo pidiera la cola o lo pidiera el operador: el juicio no
 * cambia segun quien pregunte. Meterlo en el motivo obligaria a tener
 * `juicio_obsoleto` y `juicio_obsoleto_a_peticion`, dos palabras para el mismo
 * juicio — la leccion de las veintiseis formas de escribir «permisos».
 *
 *   agente     lo eligio la cola del motor y el analista lo dictamino
 *   operador   el operador pidio verificar ESA fila, y el analista la dictamino
 *   terminal   un turno del Terminal edito con ESA fila en foco y se conservo, y
 *              el analista la dictamino (ADR-088). No es el operador: el acto
 *              que dispara la verificacion es del agente del Terminal
 *
 * NULL no es un valor mas: es «no consta». Lo llevan las filas extinguidas
 * antes de que esta columna existiera —27 de agosto, de la era en que la
 * ausencia extinguia— y las absorbidas por una fusion, que no las cerro nadie:
 * fundir no es resolver. Que se distingan importa, porque una pantalla que
 * pintara las tres clases como «resuelto» repetiria la mentira que ADR-065
 * vino a impedir.
 */
export const EXTINGUIDO_POR = ['agente', 'operador', 'terminal'] as const

export type ExtinguidoPor = (typeof EXTINGUIDO_POR)[number]

export function esExtinguidoPor(value: unknown): value is ExtinguidoPor {
  return typeof value === 'string' && (EXTINGUIDO_POR as readonly string[]).includes(value)
}
