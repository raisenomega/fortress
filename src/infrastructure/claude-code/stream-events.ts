import type { TokenUsage } from '@domain/telemetry/token-usage'
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
    usage: parseUsage(event)
  }
}

function describeDenial(denial: unknown): string {
  const entry = denial as { tool_name?: string; tool_input?: { command?: string } }
  return entry.tool_input?.command ?? entry.tool_name ?? 'operacion bloqueada'
}
