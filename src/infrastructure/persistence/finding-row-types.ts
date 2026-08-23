/** Las formas de fila de `findings`: la que sale de la base y la que entra. */

export interface FindingRow {
  readonly id: string
  readonly project_id: string
  readonly severity: string
  readonly title: string
  readonly file: string
  readonly line: number | null
  readonly status: string
  readonly lifecycle: string
  readonly mitigated_note: string | null
  readonly last_seen: string | null
}

/** Parametros con nombre del INSERT. */
export interface FindingInsert {
  readonly id: string
  readonly projectId: string
  readonly severity: string
  readonly title: string
  readonly file: string
  readonly line: number | null
  readonly fingerprint: string
  /** Clave estable: decide si esto es una fila nueva o una que ya existia. */
  readonly identity: string
  readonly status: string
  readonly scanId: string
  /** Momento del escaneo. Sirve de created_at, first_seen y last_seen. */
  readonly at: string
}
