import type { AgentId } from '@domain/agent/agent'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { sendMessage } from './chat-service'

/** ¿Este proyecto tiene un lote precargado esperando el Enter del operador? */
export function lotePendienteDe(projectId: string): boolean {
  const pendiente = useColaDelLoteStore.getState().pendiente
  return pendiente !== null && pendiente.projectId === projectId
}

/**
 * El turno de PLAN del lote (ADR-088, arco 1). El Enter del operador lo manda, y
 * el turno PARA: el productor propone su orden de ejecucion y devuelve el
 * control. La cola NO arranca aqui.
 *
 * Va SIEMPRE en `supervisado`, que es modo `plan` en el CLI: el turno lee,
 * consulta el grafo y propone, pero no toca un fichero — ni siquiera si el
 * proyecto corre en autonomo. Asi el productor puede decir «rota las llaves
 * primero» sin haber tocado nada mientras lo dice.
 *
 * PUNTO DE PARADA. Aqui espera el APROBADOR del lote:
 * - hoy, en supervisado, es el OPERADOR: lee el plan y pulsa «Ejecutar plan»;
 * - en la PIEZA 5 sera OMEGA quien apruebe en autonomo, y entra JUSTO AQUI:
 *   en vez de marcar el lote como planeado y esperar, se le pasa el plan a
 *   OMEGA y su veredicto dispara `resolverLotePendiente`. El flujo no cambia;
 *   solo cambia quien aprueba.
 */
export async function planDelLote(
  projectId: string,
  prompt: string,
  excludedAgents: readonly AgentId[]
): Promise<void> {
  await sendMessage({ projectId, prompt, mode: 'supervisado', excludedAgents })
  useColaDelLoteStore.getState().marcarPlaneado(projectId)
}
