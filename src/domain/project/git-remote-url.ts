/**
 * Una URL de remoto git aceptable (PASO 163): https(s), ssh:// o la forma corta
 * `git@host:ruta`. Puro, sin tocar disco: el adaptador decide DÓNDE escribir,
 * el dominio decide QUÉ es una URL legítima. `file://` y la basura quedan fuera:
 * un remoto no apunta a un fichero local ni a un esquema que el sistema asocie.
 */
export function esUrlDeRemoto(raw: string): boolean {
  const u = raw.trim()
  if (u.length === 0) return false
  if (/^https?:\/\/\S+$/.test(u)) return true
  if (/^ssh:\/\/\S+$/.test(u)) return true
  if (/^[\w.-]+@[\w.-]+:\S+$/.test(u)) return true
  return false
}
