import { parseDocBlocks } from '@domain/chat/config-docs'
import { useConfigurationStore } from '../stores/configuration-store'
import { useProjectStore } from '../stores/project-store'

/**
 * Captura los borradores que el agente propuso en el ultimo reply, solo si el
 * proyecto esta en configuracion. Determinista: la app escribira EXACTO esto en
 * disco al ejecutar. Aislado de chat-service para no crear un ciclo de imports.
 */
export function captureConfigDrafts(projectId: string, text: string): void {
  const project = useProjectStore.getState().projects.find((p) => p.id === projectId)
  if (project?.configState !== 'PENDIENTE_CONFIGURACION') return

  const blocks = parseDocBlocks(text)
  if (blocks.size > 0) useConfigurationStore.getState().mergeDrafts(projectId, blocks)
}
