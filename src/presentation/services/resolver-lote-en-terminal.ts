import { avisoDeAprobacion } from '@domain/chat/lote-del-terminal'
import { api } from '../adapters/fortress-api'
import { useAgentStore } from '../stores/agent-store'
import { useChatStore } from '../stores/chat-store'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { useLoteStore } from '../stores/lote-store'
import { useScanStore } from '../stores/scan-store'
import { useSettingsStore } from '../stores/settings-store'
import { useUiStore } from '../stores/ui-store'
import { useWorkflowStore } from '../stores/workflow-store'
import { loadHistory, sendMessage } from './chat-service'
import { correrLote, type PuertosDeLaCola } from './cola-del-lote'
import { loadFindings } from './scan-service'

/** Los puertos reales de la cola, atados a un proyecto. */
function puertos(projectId: string): PuertosDeLaCola {
  const cola = useColaDelLoteStore.getState
  return {
    modo: () => useSettingsStore.getState().mode,
    excluidos: () => useAgentStore.getState().excluded,
    hallazgo: (id) => (useScanStore.getState().byProject[projectId] ?? []).find((f) => f.id === id),
    abrirTerminal: () => {
      // Un mensaje que esperaba Aprobar era de otra peticion: fuera, como en
      // «Resolver en Terminal». Y el Terminal a la vista: el operador lo sigue.
      useWorkflowStore.getState().setPending(null)
      useUiStore.getState().setView('chat')
    },
    enviar: sendMessage,
    recargar: () => loadFindings(projectId),
    contar: async (content) => {
      const mensaje = { projectId, role: 'system', content, agentId: null } as const
      await api().chat.append({ ...mensaje, mode: 'autonomo', engine: 'claude-code' })
      await loadHistory(projectId)
    },
    cola: {
      // Un turno manual en marcha tambien ocupa: el carril del proyecto es uno.
      ocupada: () =>
        cola().enCurso !== null || useChatStore.getState().streamingByProject[projectId] === true,
      arrancar: (total) => cola().arrancar(projectId, total),
      avanzar: () => cola().avanzar(),
      cortado: () => cola().cortado,
      terminar: () => cola().terminar()
    }
  }
}

/**
 * «Aprobar plan y resolver» (ADR-088, arco 1): la aprobacion del PLAN es la
 * autorizacion, y con ella la cola corre los N turnos en EDICION sin volver a
 * preguntar. No se re-aprueba cada turno: eso seria supervisar uno a uno, que es
 * justo lo que un lote no es.
 *
 * Al acabar limpia la seleccion y el pendiente —eran «lo que voy a hacer», no
 * «lo que hice»—. Si la cola no arranca, los dos se quedan como estaban.
 */
export async function aprobarYResolver(projectId: string): Promise<void> {
  const pendiente = useColaDelLoteStore.getState().pendiente
  if (pendiente === null || pendiente.projectId !== projectId) return

  const p = puertos(projectId)
  // El consentimiento queda escrito ANTES de tocar nada: si luego se detiene, en
  // el historial consta igual lo que se autorizo y con que freno.
  await p.contar(avisoDeAprobacion(pendiente.ids.length))
  const hecho = await correrLote(projectId, pendiente.ids, p)
  if (hecho === null) return
  useColaDelLoteStore.getState().descartar()
  useLoteStore.getState().limpiar(projectId)
}
