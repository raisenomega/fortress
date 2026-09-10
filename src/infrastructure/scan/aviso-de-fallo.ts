import type { CodeAgentReply } from '@domain/chat/code-agent'
import type { IntentoFallido, MotivoDelFallo } from '@domain/scan/intento-fallido'

/** Quien recibe el intento que no llego a informe. Por defecto, nadie. */
export type AvisoDeFallo = (intento: IntentoFallido) => void

/**
 * Saca la FACTURA del intento antes de que el fallo se convierta en
 * `err(string)`. Es el unico momento en que existe: `Result` solo es generico
 * en su valor, asi que lo que no salga de aqui no sale de ningun sitio, y por
 * ahi se perdian el gasto, las herramientas y la duracion de todo escaneo que
 * moria.
 */
export function avisarDelFallo(
  onFallo: AvisoDeFallo,
  projectId: string,
  reply: CodeAgentReply,
  motivo: MotivoDelFallo,
  durationMs: number
): void {
  onFallo({
    projectId,
    motivo,
    durationMs,
    usage: reply.usage,
    tools: reply.tools,
    texto: reply.text
  })
}
