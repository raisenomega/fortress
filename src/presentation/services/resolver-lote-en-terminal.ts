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
 * «Resolver lote en Terminal»: corre la cola con los elegidos, en el orden en que
 * se eligieron, y limpia la seleccion al acabar —era «lo que voy a hacer», no
 * «lo que hice»—. Si la cola no arranca, la seleccion se queda como estaba.
 */
export async function resolverLoteEnTerminal(projectId: string): Promise<void> {
  const ids = [...(useLoteStore.getState().seleccion[projectId] ?? [])]
  const hecho = await correrLote(projectId, ids, puertos(projectId))
  if (hecho !== null) useLoteStore.getState().limpiar(projectId)
}
