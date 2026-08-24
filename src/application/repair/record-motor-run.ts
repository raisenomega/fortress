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
 * Una corrida cuya factura no se pudo leer SI se asienta, diciendo que no la
 * hubo. Antes se descartaba —escribirla en cero afirmaba que salio gratis— y
 * eso resolvia la mentira creando un agujero: quince minutos de generador que
 * ocurrieron, gastaron y no dejaban rastro. Los dos extremos enganan.
 *
 * Ahora la fila entra con `usage_known = 0`: sus contadores en cero significan
 * "no se" y no "gratis", y la DURACION viaja intacta, que es el unico dato
 * cuantitativo cierto de una corrida que murio antes de facturar. El dinero que
 * falta no se estima: no existe en ningun sitio, y estimarlo subestimaria justo
 * donde duele, porque las que se quedan sin factura son las largas.
 *
 * Nunca hace fallar la fase: perder una fila de telemetria es molesto; perder
 * el analisis que el operador acaba de pagar, no.
 *
 * Devuelve el id de la fila, o null si no la hubo. El repositorio siempre lo
 * daba y aqui se tiraba, asi que el asiento del libro citaba una corrida que no
 * podia senalar: dos registros de lo mismo sin manera de cruzarlos.
 */
export function recordMotorRun(
  ctx: AppContext,
  projectId: string,
  agentId: AgentId | null,
  runMeta: AnalystRunMeta,
  failed = false
): string | null {
  try {
    return ctx.runs.record({
      projectId,
      agentId,
      kind: 'repair',
      durationMs: runMeta.durationMs,
      failed,
      // `undefined` viaja tal cual hasta la fila: es la señal, no un hueco.
      ...(runMeta.usage === undefined ? {} : { usage: runMeta.usage }),
      tools: []
    }).id
  } catch (error) {
    console.error('[motor] no se pudo asentar la corrida', projectId, error)
    return null
  }
}

/** El mismo resultado, con el id de su corrida ya dentro del runMeta. Sin id
 *  —no se pudo asentar— se devuelve intacto: mejor sin cita que con una falsa. */
export function conAgentRun<T extends { readonly runMeta: AnalystRunMeta }>(
  resultado: T,
  agentRunId: string | null
): T {
  if (agentRunId === null) return resultado
  return { ...resultado, runMeta: { ...resultado.runMeta, agentRunId } }
}
