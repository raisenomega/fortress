import { isPrivateHost } from '../posture/private-host'
import { err, ok, type Result } from '../shared/result'

/**
 * Valida la URL de un MCP custom antes de guardarla.
 *
 * Solo https: un MCP viaja con las credenciales del operador y todo lo que el
 * agente lee del proyecto. Por http eso va en claro y cualquiera en la red lo
 * ve o lo altera; no hay "es solo para probar" que lo justifique.
 *
 * Se exige el esquema escrito: anteponer https:// a lo que sea colaria
 * "javascript:alert(1)" como si fuera un host valido.
 */
export function parseConnectorUrl(raw: string): Result<string> {
  const trimmed = raw.trim()
  if (trimmed === '') return err('Escribe la URL del servidor MCP')

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return err('Esa URL no es valida: escribela entera, con https://')
  }

  if (parsed.protocol !== 'https:') return err('Un servidor MCP solo puede ir por https://')
  if (parsed.hostname === '') return err('Esa URL no tiene servidor')

  // user:pass@host guardaria un secreto en claro en la base y en los argumentos
  // del proceso hijo, donde lo lee cualquier `ps`. El token va en la sesion MCP.
  if (parsed.username !== '' || parsed.password !== '') {
    return err('No pongas usuario ni contrasena en la URL')
  }

  // El filtro de host privado ya existia y lo aplicaba la POSTURA; aqui no se
  // llamaba. Un MCP en 127.0.0.1, en la red interna o en 169.254.169.254 —los
  // metadatos de la nube— es un destino al que FORTRESS le manda credenciales y
  // lo que el agente lee del proyecto. Que sea https no lo hace tuyo.
  if (isPrivateHost(parsed.hostname)) {
    return err('Un servidor MCP no puede estar en la red privada ni en localhost')
  }

  return ok(parsed.toString())
}
