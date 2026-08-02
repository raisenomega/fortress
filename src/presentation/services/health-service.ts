import { api } from '../adapters/fortress-api'
import { useHealthStore } from '../stores/health-store'

/** Corre el diagnostico completo y lo publica en el store. */
export async function runHealthCheck(): Promise<void> {
  const store = useHealthStore.getState()
  if (store.running) return

  store.setRunning(true)
  try {
    store.setReport(await api().health.run())
  } finally {
    useHealthStore.getState().setRunning(false)
  }
}
