/**
 * Clase de asiento del Libro de la Vida. Forense: cada linea se clasifica.
 *
 * 'merge' clasifica las decisiones de integracion automatica. Tiene clase
 * propia y no cae en 'nota' porque en modo autonomo es el asiento mas
 * numeroso: dejarlo sin clasificar obligaria a buscar cadenas en el resumen
 * para listarlas, que es justo lo que este campo existe para evitar.
 *
 * 'aplicabilidad' es del mismo caso (ADR-083, Fase 4): que modulos de la
 * campana le tocan a un proyecto y por que. Su clase propia es lo que deja
 * responder «que se decidio no auditar, y con que prueba» sin buscar cadenas,
 * que es la pregunta que un informe de auditoria tiene que poder contestar.
 */
export type OmegaKind = 'verificacion' | 'score' | 'nota' | 'merge' | 'aplicabilidad'

/**
 * Veredicto. 'discrepancia' (reportado != disco) y 'veto' (push bloqueado) son
 * los acusatorios; ambos llevan evidencia siempre.
 *
 * NO crece con la aplicabilidad: decidir que M8 aplica no acusa a nadie, asi
 * que va como 'info', igual que el termometro de vocabulario. Anadir valores
 * aqui para un caso que no acusa diluiria justo lo que separa a los dos
 * acusatorios del resto.
 */
export type OmegaVerdict = 'ok' | 'discrepancia' | 'info' | 'veto'

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
