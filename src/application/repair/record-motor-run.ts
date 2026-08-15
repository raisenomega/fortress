import type { AgentId } from '@domain/agent/agent'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import type { AppContext } from '../context'

/**
 * Deja constancia de lo que costo una fase del motor en el mismo libro mayor
 * que el chat. `agent_runs` es de donde sale el tope diario: lo que no pasa por
 * aqui, `spentToday` no lo ve, y el motor llevaba desde siempre gastando fuera
 * de esa cuenta.
 *
 * El analista y el generador se asientan SIN agente. No es descuido: la lista de
 * agentes gobierna el catalogo que el operador ve y elige, y estas dos son fases
 * del motor, no agentes. El revisor si lleva el suyo, porque ya existe y ya
 * firma con ese nombre en el libro de OMEGA.
 *
 * Una corrida cuya factura no se pudo leer NO se asienta. Escribirla en cero
 * diria que salio gratis, y la casa lleva desde el primer dia negandose a
 * inventar numeros que no vio.
 *
 * Nunca hace fallar la fase: perder una fila de telemetria es molesto; perder
 * el analisis que el operador acaba de pagar, no.
 */
export function recordMotorRun(
  ctx: AppContext,
  projectId: string,
  agentId: AgentId | null,
  runMeta: AnalystRunMeta,
  failed = false
): void {
  if (runMeta.usage === undefined) {
    console.warn('[motor] corrida sin factura legible: no se asienta', projectId)
    return
  }

  try {
    ctx.runs.record({
      projectId,
      agentId,
      kind: 'repair',
      durationMs: runMeta.durationMs,
      failed,
      usage: runMeta.usage,
      tools: []
    })
  } catch (error) {
    console.error('[motor] no se pudo asentar la corrida', projectId, error)
  }
}
