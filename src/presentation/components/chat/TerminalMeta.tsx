import { findAgent } from '@domain/agent/agent-catalog'
import type { ChatMessage } from '@domain/chat/chat-message'

/** Hora local HH:MM:SS del sello ISO del mensaje. */
function clock(iso: string): string {
  return new Date(iso).toTimeString().slice(0, 8)
}

/** Procedencia y medidas (en gris): agente, modo, motor, hora y tamano. */
function infoParts(message: ChatMessage): string[] {
  const agent = message.agentId ? findAgent(message.agentId) : undefined
  const parts: string[] = []
  if (agent) parts.push(agent.name)
  parts.push(message.mode)
  if (message.role === 'assistant') {
    parts.push(message.engine === 'claude-code' ? 'claude-code' : 'texto')
  }
  parts.push(clock(message.createdAt))
  parts.push(`${message.content.length}c`)
  return parts
}

/**
 * Estado del turno con color por severidad: rojo un aviso del sistema, naranja
 * "en curso" autonomo (sin supervision), amarillo "en curso" supervisado, verde
 * "listo". Null en los turnos del operador, que no tienen estado.
 */
function status(message: ChatMessage): { label: string; tone: string } | null {
  if (message.role === 'system') return { label: 'aviso', tone: 'text-critical' }
  if (message.role !== 'assistant') return null
  if (message.pending) {
    return { label: 'en curso', tone: message.mode === 'autonomo' ? 'text-high' : 'text-medium' }
  }
  return { label: 'listo', tone: 'text-success' }
}

interface TerminalMetaProps {
  readonly message: ChatMessage
}

/** La linea gris que prefija cada turno; el estado va coloreado por severidad. */
export function TerminalMeta({ message }: TerminalMetaProps): React.JSX.Element {
  const state = status(message)
  return (
    <p className="pl-5 font-mono text-[10px] text-muted-foreground/70 select-none">
      {infoParts(message).join(' · ')}
      {state ? (
        <>
          {' · '}
          <span className={state.tone}>{state.label}</span>
        </>
      ) : null}
    </p>
  )
}
