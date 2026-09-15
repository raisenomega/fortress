import type { Finding } from '@domain/project/finding'
import { useUiStore } from '../stores/ui-store'
import { useWorkflowStore } from '../stores/workflow-store'

/**
 * El borrador que queda escrito en el Terminal. Nombra el hallazgo para que el
 * operador vea a cual se refiere antes de enviarlo; lo que el agente recibe de
 * verdad sale de la base por el `findingId`, no de este texto.
 */
export function borradorDeResolucion(finding: Finding): string {
  const donde = finding.line === null ? finding.file : `${finding.file}:${finding.line}`
  return `Resuelve este hallazgo ${finding.severity} de ${donde}: ${finding.title}`
}

/**
 * «Resolver en Terminal» (ADR-088, pieza 2), con el molde de `AskChatButton`:
 * fija el foco, deja el borrador escrito y abre el Terminal. No envia nada: el
 * operador lo lee y lo manda, y en supervisado todavia le queda Aprobar.
 *
 * Un mensaje que esperaba aprobacion se descarta: era de otra peticion, y si
 * se quedara, Aprobar lo mandaria con el foco de ESTE hallazgo pegado.
 */
export function resolverEnTerminal(projectId: string, finding: Finding): void {
  const flujo = useWorkflowStore.getState()
  flujo.setPending(null)
  flujo.setFoco({ projectId, findingId: finding.id })
  flujo.setDraft(borradorDeResolucion(finding))
  useUiStore.getState().setView('chat')
}
