import type { FindingInsert } from './finding-row'

/** Parametros del UPDATE de un hallazgo que se vuelve a ver. */
export interface FindingTouch {
  readonly id: string
  readonly severity: string
  readonly title: string
  readonly file: string
  readonly line: number | null
  readonly fingerprint: string
  readonly scanId: string
  readonly at: string
}

/**
 * El INSERT y el UPDATE no comparten forma: el UPDATE no toca `first_seen` ni
 * `identity`, que son la historia y la clave. Se construye a mano en vez de
 * reenviar la fila entera, para que no se pueda colar por descuido un campo
 * que deberia quedarse quieto.
 */
export function toTouch(row: FindingInsert, id: string): FindingTouch {
  const { severity, title, file, line, fingerprint, scanId, at } = row
  return { id, severity, title, file, line, fingerprint, scanId, at }
}
