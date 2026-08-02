/**
 * Solo se abren enlaces web. `shell.openExternal` acepta cualquier esquema, y
 * eso incluye `file://` para abrir cualquier cosa del disco y esquemas que el
 * sistema pueda tener asociados a un programa. Hoy los enlaces los escribe
 * FORTRESS, pero manana los escribira un agente.
 */
const ALLOWED = new Set(['https:', 'http:'])

export function isSafeExternalUrl(raw: string): boolean {
  try {
    return ALLOWED.has(new URL(raw).protocol)
  } catch {
    // Lo que no se puede ni parsear como URL, no se abre.
    return false
  }
}
