/**
 * Por que dejo de correr un escaneo. Vocabulario CERRADO, como `EstadoScan` y
 * los tipos de defecto: ahora que el cierre ESCRIBE este valor, dejarlo como
 * texto libre invitaria a la misma deriva que ADR-080 cerro para la severidad
 * —la misma causa dicha de tres maneras en tres corridas— y a que nadie pueda
 * contar cuantos escaneos murio el reloj.
 *
 * `abortado` y `fallo` NO son lo mismo y no se mezclan: uno es el operador
 * apretando Detener —una decision, con su recorrido a medias pero sano— y el
 * otro es el escaner reventando. Contarlos juntos haria invisible cuantas veces
 * se rompe la maquina, que es justo lo que este arco viene a poder contar.
 */
export const MOTIVOS_CIERRE = ['completo', 'timeout', 'presupuesto', 'abortado', 'fallo'] as const

export type MotivoCierre = (typeof MOTIVOS_CIERRE)[number]

/**
 * Fuera del vocabulario no se adivina: cae a `abortado`.
 *
 * El centinela NO es `completo`, que seria el centinela comodo. `completo`
 * afirma que el recorrido termino entero, y esa es justo la afirmacion que no
 * se puede hacer sobre un valor que no se entiende. Ante la duda se dice que
 * algo se corto, que es lo que un motivo ilegible sugiere. Tampoco es `fallo`:
 * eso afirmaria una averia que nadie vio.
 */
export function aMotivoCierre(value: unknown): MotivoCierre {
  return (MOTIVOS_CIERRE as readonly string[]).includes(value as string)
    ? (value as MotivoCierre)
    : 'abortado'
}
