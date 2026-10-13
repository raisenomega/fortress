import type { ChatMessage } from '@domain/chat/chat-message'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { DesenlaceDelCierre } from '@domain/chat/cierre-del-ciclo'
import type { SinCierre } from '@domain/chat/motivo-sin-cierre'
import type { ReplyOutcome } from './reply-outcome'
import type { SendMessageOutput } from './send-message-types'

/** El modelo del TURNO: el del primer run (el principal que respondio), o el
 *  del outcome cuando no hubo runs (la rama de la API). Sin dato, undefined —
 *  afirmar un modelo que no consta seria inferir (ADR-078). */
const modeloDelTurno = (outcome: ReplyOutcome): string | undefined =>
  outcome.runs[0]?.modelo ?? outcome.modelo

/**
 * La salida del turno con el CIERRE del resultado (PASO 87): failed, edits,
 * usage, modelo y el numero de hallazgos ya existian en el outcome del main y
 * se quedaban alli — el reporte de tarea los necesita al otro lado del puente.
 * Cruzan DATOS PLANOS que ya cruzaban por otras vias (rutas en Actividad,
 * numeros en el medidor); el texto va en `assistant`, ya tachado y sin NOTAS.
 */
export function salidaDelTurno(
  user: ChatMessage,
  assistant: ChatMessage,
  engine: ChatEngine,
  outcome: ReplyOutcome,
  sinCierre: SinCierre | null,
  sinVerificar: boolean,
  desenlace: DesenlaceDelCierre = null
): SendMessageOutput {
  const modelo = modeloDelTurno(outcome)
  return {
    user,
    assistant,
    engine,
    sinCierre,
    sinVerificar,
    desenlace,
    failed: outcome.failed,
    edits: outcome.edits,
    usage: outcome.usage,
    hallazgos: outcome.findings.length,
    ...(modelo === undefined ? {} : { modelo })
  }
}
