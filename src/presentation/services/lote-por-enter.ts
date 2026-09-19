import type { AgentId } from '@domain/agent/agent'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { sendMessage } from './chat-service'
import { resolverLotePendiente } from './resolver-lote-en-terminal'

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
 * PUNTO DE PARADA. Aqui espera el APROBADOR del lote, y quien se sienta ahi
 * depende del modo (ADR-097 §3):
 * - en SUPERVISADO es el OPERADOR: el lote queda planeado, aparece «Ejecutar
 *   plan» y su clic lo dispara. `plan` llega null y nada de esto cambia;
 * - en AUTONOMO es OMEGA: el main juzgo la direccion antes de devolver, y su
 *   ADELANTE dispara la ejecucion SIN pasar por ningun boton.
 *
 * El disparo de aqui NO es la garantia: solo ahorra el clic. La garantia vive en
 * el main —`guardPlanAprobado` no deja correr un hallazgo del lote sin que
 * `aprobarLote` lo haya autorizado—, asi que llamar a `resolverLotePendiente`
 * sin ADELANTE no ejecutaria nada; simplemente fallaria en la puerta.
 */
export async function planDelLote(
  projectId: string,
  prompt: string,
  excludedAgents: readonly AgentId[]
): Promise<void> {
  const { plan } = await sendMessage({ projectId, prompt, mode: 'supervisado', excludedAgents })
  if (plan === 'ADELANTE') return resolverLotePendiente(projectId)
  useColaDelLoteStore.getState().marcarPlaneado(projectId, plan)
}
