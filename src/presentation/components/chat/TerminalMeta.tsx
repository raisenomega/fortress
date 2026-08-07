import { findAgent } from '@domain/agent/agent-catalog'
import type { ChatMessage } from '@domain/chat/chat-message'

/** Hora local HH:MM:SS del sello ISO del mensaje. */
function clock(iso: string): string {
  return new Date(iso).toTimeString().slice(0, 8)
}

/**
 * Metadatos del turno como linea de log de terminal. Recupera la procedencia
 * (agente/modo/motor) que antes vivia en los chips y suma tres medidas propias
 * de una consola: hora, tamano de la salida y estado del turno.
 */
function metaParts(message: ChatMessage): string[] {
  const agent = message.agentId ? findAgent(message.agentId) : undefined
  const assistant = message.role === 'assistant'
  const parts: string[] = []
  if (agent) parts.push(agent.name)
  parts.push(message.mode)
  if (assistant) parts.push(message.engine === 'claude-code' ? 'claude-code' : 'texto')
  parts.push(clock(message.createdAt))
  parts.push(`${message.content.length}c`)
  if (assistant) parts.push(message.pending ? 'en curso' : 'listo')
  return parts
}

interface TerminalMetaProps {
  readonly message: ChatMessage
}

/** La linea gris que prefija cada turno en el Terminal, alineada con la salida. */
export function TerminalMeta({ message }: TerminalMetaProps): React.JSX.Element {
  return (
    <p className="pl-5 font-mono text-[10px] text-muted-foreground/70 select-none">
      {metaParts(message).join(' · ')}
    </p>
  )
}
