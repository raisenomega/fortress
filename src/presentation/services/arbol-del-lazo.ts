import { api } from '../adapters/fortress-api'

/**
 * El arbol limpio del lazo (ATERRIZAJE-4). Al ARRANCAR: stash del WIP del cliente
 * -> el commit durable toma solo lo del agente. Al PARAR: restaura el WIP (pop);
 * si conflicta, el main NO fuerza y deja el stash. Un fallo no corta el lazo.
 */
export async function stashAlArrancar(projectId: string): Promise<void> {
  try {
    await api().repair.lazoStash(projectId)
  } catch {
    // sin stash el lazo sigue (el commit tomaria tambien el WIP; mejor que reventar)
  }
}

export async function restaurarAlParar(projectId: string): Promise<void> {
  try {
    await api().repair.lazoPop(projectId)
  } catch {
    // el cierre del lazo no revienta por el pop
  }
}
