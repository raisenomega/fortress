/** Los dos hechos de una fila del tablero, tal como la fila los calcula. */
export interface EstadoDeLaFila {
  /** Descartada por el operador: «no era un problema». */
  readonly dismissed: boolean
  /** Marcada como ya arreglada: deja de pedir trabajo. */
  readonly mitigado: boolean
}

/**
 * Donde se ofrece «Resolver en Terminal» (ADR-088, pieza 2): en las MISMAS filas
 * que el boton del motor —ni descartadas ni mitigadas—, porque las dos acciones
 * responden a la misma pregunta: ¿este hallazgo pide trabajo?
 *
 * Recibe los dos hechos que ya usa la fila, y no el hallazgo, para que no haya
 * dos cuentas de lo mismo. Y NO mira la severidad: el Terminal es la
 * herramienta del cliente y resuelve cualquiera, CRITICAL y HIGH incluidos.
 */
export function seResuelveEnTerminal(fila: EstadoDeLaFila): boolean {
  return !fila.dismissed && !fila.mitigado
}
