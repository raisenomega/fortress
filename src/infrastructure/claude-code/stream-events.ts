import type { TokenUsage } from '@domain/telemetry/token-usage'
import { describeDenial, nombreDeHerramienta } from './lectura-del-denial'
import { parseAssistant, type AssistantEvent } from './parse-assistant'
import { parseUsage } from './parse-usage'

/**
 * Eventos del `--output-format stream-json` de Claude Code, quedandose solo
 * con lo que la UI necesita. La forma esta tomada de la salida real del CLI
 * 2.1.220, no de la documentacion.
 */
export interface ParsedEvent extends AssistantEvent {
  readonly finalText?: string
  readonly failed?: boolean
  readonly denials?: readonly string[]
  /**
   * Solo los NOMBRES de las herramientas denegadas, sin el comando. Viaja
   * aparte de `denials` —que es la nota de transparencia para el operador— y no
   * en vez de el: son dos datos con dos usos y dos riesgos distintos.
   *
   * El nombre es GENERICO por naturaleza (`Bash`, `mcp__codebase-memory__...`) y
   * por eso es seguro por construccion: no puede llevar codigo del cliente
   * aunque nadie lo redacte. El comando SI lo lleva —los denials reales de la
   * base traen `/home/jojo/Escritorio/...`— y por eso no sale de aqui.
   */
  readonly deniedTools?: readonly string[]
  /** Solo lo trae el evento final: tokens y coste de toda la ejecucion. */
  readonly usage?: TokenUsage
}

/** Una linea NDJSON del CLI. Devuelve null si no aporta nada a la UI. */
export function parseStreamLine(line: string): ParsedEvent | null {
  const trimmed = line.trim()
  if (trimmed.length === 0) return null

  let event: Record<string, unknown>
  try {
    event = JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    // El CLI puede escribir avisos sueltos que no son JSON; se ignoran.
    return null
  }

  if (event.type === 'assistant') return parseAssistant(event)
  if (event.type === 'result') return fromResult(event)
  return null
}

function fromResult(event: Record<string, unknown>): ParsedEvent {
  const denials = Array.isArray(event.permission_denials)
    ? event.permission_denials.map((denial) => describeDenial(denial))
    : []

  return {
    finalText: typeof event.result === 'string' ? event.result : '',
    failed: event.is_error === true || event.subtype !== 'success',
    denials,
    deniedTools: Array.isArray(event.permission_denials)
      ? event.permission_denials.map((denial) => nombreDeHerramienta(denial))
      : [],
    usage: parseUsage(event)
  }
}
