import { GRAPH_CORE_TOOLS, type GraphAb, type GraphVerify } from './graph-actions'
import type { GraphStatus } from './graph-status'

/** Estado visual comun a las 3 acciones del grafo. */
export type ActionTone = 'idle' | 'running' | 'ok' | 'warn' | 'error'

/**
 * Verificar: verde si conecta Y responden las 3 tools clave; naranja si conecta
 * pero faltan tools; rojo si no conecta; gris si aun no se ejecuto.
 */
export function verifyTone(verify: GraphVerify | null, running: boolean): ActionTone {
  if (running) return 'running'
  if (!verify) return 'idle'
  if (!verify.connected) return 'error'
  return GRAPH_CORE_TOOLS.every((tool) => verify.tools.includes(tool)) ? 'ok' : 'warn'
}

/**
 * Instalar: verde si quedo indexado (stats con nodos); naranja si configurado
 * pero sin indice (necesita indexar/verificar); rojo si fallo; gris si nada.
 */
export function installTone(status: GraphStatus, running: boolean, failed: boolean): ActionTone {
  if (running) return 'running'
  if (failed) return 'error'
  if (status.stats && status.stats.nodes > 0) return 'ok'
  return status.state === 'configurado' ? 'warn' : 'idle'
}

/** A/B: naranja midiendo; verde si ambas respondieron; rojo si alguna fallo. */
export function abTone(ab: GraphAb | null, running: boolean, failed: boolean): ActionTone {
  if (running) return 'running'
  if (failed) return 'error'
  if (!ab) return 'idle'
  return ab.lectura.answered && ab.normal.answered ? 'ok' : 'error'
}
