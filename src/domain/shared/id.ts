/** Identificador unico. Disponible en el main process y en el renderer. */
export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}
