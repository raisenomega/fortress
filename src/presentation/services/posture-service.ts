import { buildPostureReport } from '@domain/posture/posture-report'
import { api } from '../adapters/fortress-api'
import { usePostureStore } from '../stores/posture-store'
import { useUiStore } from '../stores/ui-store'
import { useWorkflowStore } from '../stores/workflow-store'

/** Audita el sitio y, si sale bien, deja el informe listo para el chat. */
export async function runPosture(): Promise<void> {
  const { url, depth, owned, running } = usePostureStore.getState()
  if (running) return

  usePostureStore.getState().start()
  try {
    const result = await api().posture.run({ url, depth, owned })
    usePostureStore
      .getState()
      .finish(result.ok ? result.value : null, result.ok ? null : result.error)
  } catch (error) {
    // Sin catch, un fallo del canal dejaria running:true para siempre y el
    // boton bloqueado en "Auditando..." hasta reiniciar la app.
    const detail = error instanceof Error ? error.message : 'La auditoria se interrumpio'
    usePostureStore.getState().finish(null, detail)
  }
}

/** Manda el informe al chat, con la pregunta ya escrita: solo pulsar Enter. */
export function sendPostureToChat(): void {
  const result = usePostureStore.getState().result
  if (!result) return

  const informe = buildPostureReport(result.host, result.findings)
  useWorkflowStore
    .getState()
    .setDraft(`${informe}\n\nExplicame estos hallazgos de exposicion y por cual empezar.`)
  useUiStore.getState().setView('chat')
}
