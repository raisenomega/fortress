import type { OperationMode } from '@domain/settings/operation-mode'
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
 * El lote con UN solo gesto: el ENTER del operador sobre el mensaje precargado
 * (ADR-088, arco 1, simplificado).
 *
 * Ese Enter es su aprobacion, asi que el mensaje NO pasa por la tarjeta de plan
 * de supervisado: pedir dos veces lo mismo —y con una estimacion de workflow que
 * este turno ni siquiera va a correr— solo asusta y estorba.
 *
 * Primero sale el mensaje tal cual (el productor ve los N del lote, se los pone
 * `conLoteDelPlan`); cuando ese turno termina, arranca la cola y para sola. En
 * pantalla solo quedan el indicador y el parte final.
 */
export async function planYResolverLote(
  projectId: string,
  prompt: string,
  mode: OperationMode,
  excludedAgents: readonly AgentId[]
): Promise<void> {
  await sendMessage({ projectId, prompt, mode, excludedAgents })
  await resolverLotePendiente(projectId)
}
