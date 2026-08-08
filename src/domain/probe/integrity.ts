/** Una diferencia que la verificacion independiente (Capa 3) encontro. Forense. */
export interface Violation {
  readonly path: string
  readonly kind: 'created' | 'modified' | 'deleted'
  /** sha256 antes del audit (null si el archivo se creo durante el audit). */
  readonly before: string | null
  /** sha256 despues del audit (null si el archivo se borro durante el audit). */
  readonly after: string | null
}

/**
 * Resultado de la Capa 3: el proyecto quedo byte-identico tras el audit, o no.
 * `clean:false` con violaciones dispara el circuit breaker (Capa 4).
 */
export interface IntegrityReport {
  readonly clean: boolean
  readonly violations: readonly Violation[]
}
