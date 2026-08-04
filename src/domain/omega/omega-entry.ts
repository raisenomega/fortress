/** Clase de asiento del Libro de la Vida. Forense: cada linea se clasifica. */
export type OmegaKind = 'verificacion' | 'score' | 'nota'

/** Veredicto. 'discrepancia' es lo unico acusatorio y siempre lleva evidencia. */
export type OmegaVerdict = 'ok' | 'discrepancia' | 'info'

/** Un asiento del Libro de la Vida. Inmutable: se anexa, jamas se edita ni borra. */
export interface OmegaEntry {
  readonly id: string
  readonly at: string
  /** Proyecto auditado. Se guarda el id sin FK: el asiento sobrevive al proyecto. */
  readonly projectId: string | null
  /** Agente auditado, o null si es una nota del sistema. */
  readonly agentId: string | null
  readonly kind: OmegaKind
  readonly verdict: OmegaVerdict
  readonly summary: string
  /** Lo comprobable: archivo:linea o el dato que respalda el veredicto. */
  readonly evidence: string
}

/** Datos para anexar. El id y la marca de tiempo los pone la infraestructura. */
export interface NewOmegaEntry {
  readonly projectId: string | null
  readonly agentId: string | null
  readonly kind: OmegaKind
  readonly verdict: OmegaVerdict
  readonly summary: string
  readonly evidence?: string
}
