import { redactSecrets } from '@domain/chat/tool-detail'

/**
 * Las DOS lecturas de una denegacion. Sirven a cosas distintas y por eso no se
 * funden: una la LEE el operador y necesita el comando; la otra la APRENDE
 * FORTRESS y necesita justo lo contrario.
 *
 * La denegacion es METADATO y acaba persistida en el historial de chat como
 * parte de la nota de transparencia, asi que el comando pasa por redactSecrets:
 * un `export ANTHROPIC_API_KEY=...` bloqueado no debe quedar en claro en la
 * base. El evento final trae el comando entero, asi que se redacta de una sola
 * vez y ninguna regex se queda a medias.
 */
export function describeDenial(denial: unknown): string {
  const entry = denial as { tool_name?: string; tool_input?: { command?: string } }
  const command = entry.tool_input?.command
  if (typeof command === 'string') return redactSecrets(command)
  return entry.tool_name ?? 'operacion bloqueada'
}

/** El nombre a secas. `describeDenial` prefiere el comando porque al operador le
 *  sirve mas para entender que se bloqueo; aqui hace falta lo contrario: lo que
 *  se pueda AGRUPAR y no identifique a nadie. */
export function nombreDeHerramienta(denial: unknown): string {
  // Sin el guard, un `null` en la lista revienta al leer `tool_name` — y esto
  // corre dentro del parser del stream, asi que la excepcion se llevaria el
  // turno entero por un evento malformado del CLI.
  const nombre = (denial as { tool_name?: unknown } | null)?.tool_name
  return typeof nombre === 'string' && nombre.length > 0 ? nombre : 'desconocida'
}
