import { tacharRecibo } from '@domain/chat/recibo-de-herramientas'
import type { NewAgentRun } from '@domain/telemetry/agent-run'
import { countEdits } from '@domain/telemetry/edit-tools'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { RECIBO_SEPARATOR, SEPARATOR } from './agent-run-separators'

/**
 * La mitad de ESCRITURA de `agent_runs`. Vive aparte de `toAgentRun` —la de
 * lectura— porque son dos direcciones distintas, y porque al llegar el recibo
 * el fichero unico paso de 75 lineas. La costura es la direccion del dato.
 *
 * Sin factura los contadores van a cero igual —la columna es NOT NULL— pero
 * `usage_known = 0` los convierte en "no se" en vez de "gratis". La duracion NO
 * se toca: esa si esta medida, y es el unico dato cuantitativo que queda de una
 * corrida que murio antes de facturar.
 */
export function toRunInsert(id: string, run: NewAgentRun, at: string): Record<string, unknown> {
  const usage = run.usage ?? EMPTY_USAGE
  return {
    id,
    projectId: run.projectId,
    agentId: run.agentId,
    kind: run.kind,
    durationMs: run.durationMs,
    failed: run.failed ? 1 : 0,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cacheReadTokens: usage.cacheReadTokens,
    cacheCreationTokens: usage.cacheCreationTokens,
    costUsd: usage.costUsd,
    numTurns: usage.numTurns,
    usageKnown: run.usage === undefined ? 0 : 1,
    edits: countEdits(run.tools),
    tools: run.tools.join(SEPARATOR),
    // LA ULTIMA PUERTA (ADR-093 §3.4). El tachado vive AQUI y no donde se
    // construye el recibo: todo INSERT pasa por esta funcion, asi que no hay
    // forma de enhebrar el recibo hasta el disco sin tacharlo. Si estuviera
    // arriba, bastaria un camino nuevo que no llamara al tachador.
    recibo: run.recibo === undefined ? null : tacharRecibo(run.recibo).join(RECIBO_SEPARATOR),
    at
  }
}
