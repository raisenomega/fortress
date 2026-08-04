/** Resultado de una auditoria de OMEGA: cuanto verifico y cuanto no cuadra. */
export interface OmegaAuditReport {
  readonly verified: number
  readonly discrepancies: number
}

/**
 * Titular del asiento resumen. Honesto: 0 discrepancias no es "perfecto", es
 * que lo reportado cuadra con el disco; no dice nada de lo que NO se reporto.
 */
export function auditHeadline(verified: number, discrepancies: number): string {
  if (verified === 0) return 'Verificacion: sin hallazgos abiertos que comprobar.'
  if (discrepancies === 0) {
    return `Verificacion: ${verified} hallazgos, todos cuadran con el disco.`
  }
  return `Verificacion: ${verified} hallazgos, ${discrepancies} NO cuadran con el disco.`
}
