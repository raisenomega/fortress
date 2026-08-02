/** Resultado de validar una API key contra la API real. */
export type ApiKeyVerdict =
  | { readonly status: 'valida'; readonly model: string }
  | { readonly status: 'invalida'; readonly reason: string }
  /** No se pudo comprobar (red caida, API no disponible): no implica que sea mala. */
  | { readonly status: 'sin-verificar'; readonly reason: string }

export type InvalidVerdict = Extract<ApiKeyVerdict, { status: 'invalida' }>

/** Type guard, no solo booleano: deja acceder a `reason` sin castear. */
export function isInvalid(verdict: ApiKeyVerdict): verdict is InvalidVerdict {
  return verdict.status === 'invalida'
}

/**
 * Una key sin verificar puede guardarse igualmente: el operador puede estar
 * sin conexion. Una invalida, no: guardarla solo aplaza el error.
 */
export function isStorable(verdict: ApiKeyVerdict): boolean {
  return !isInvalid(verdict)
}
