import type { IntentoFallido } from '@domain/scan/intento-fallido'
import type { AppContext } from '../context'

/** El escaneo lo hace el Security Reviewer: es la FASE 1 del protocolo. */
const SCANNER_AGENT = 'security-reviewer' as const

/**
 * Deja constancia de un intento que NO llego a informe: su factura real, su
 * duracion y sus herramientas, con `failed: true`.
 *
 * Es la pieza que cierra la brecha del 2026-09-08. Health Flow escaneo, gasto
 * tokens reales, y la base quedo con cero filas suyas en las diez tablas: la
 * corrida solo se asentaba dentro de la transaccion del cierre, y un escaneo
 * que no llega al cierre no asentaba nada. La columna `fallidas` del dia
 * marcaba 0, y era mentira.
 *
 * Va en transaccion PROPIA y fuera de la del cierre, con el molde de
 * `recordChatRun`: perder una fila de telemetria es molesto, perder el escaneo
 * no. Por eso el `catch` calla — el operador ya tiene su error en pantalla, y
 * un fallo al anotar el fallo no puede tapar al primero.
 *
 * El `usage` viaja tal cual lo dio el CLI. Si no se pudo leer, `NewAgentRun` ya
 * admite que falte: una factura ausente NO es una factura de ceros, que
 * afirmaria que salio gratis.
 */
export function asentarIntentoFallido(context: AppContext, intento: IntentoFallido): void {
  try {
    context.transaction(() => {
      context.runs.record({
        projectId: intento.projectId,
        agentId: SCANNER_AGENT,
        kind: 'scan',
        durationMs: intento.durationMs,
        failed: true,
        usage: intento.usage,
        tools: intento.tools
      })
    })
  } catch {
    // Silencio deliberado: ver arriba.
  }
}
