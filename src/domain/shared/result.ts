/**
 * Resultado explicito en vez de excepciones: cruza el puente IPC sin perder
 * informacion (una excepcion llega al renderer como un string opaco).
 */
export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<T>(error: string): Result<T> {
  return { ok: false, error }
}
