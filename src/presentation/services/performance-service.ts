import { windowStart, type TimeWindow } from '@domain/telemetry/time-window'
import { api } from '../adapters/fortress-api'
import { usePerformanceStore } from '../stores/performance-store'

const TOP_AGENTS = 5

/**
 * Todo el dashboard con una sola ventana temporal. La hora se toma aqui, en el
 * borde: las funciones que la usan la reciben como argumento y son testables.
 */
export async function loadPerformance(window: TimeWindow): Promise<void> {
  const store = usePerformanceStore.getState()
  store.setWindow(window)
  store.setLoading(true)

  const since = windowStart(new Date(), window)

  try {
    const [usage, byProject, ranking, scans] = await Promise.all([
      api().telemetry.since(since),
      api().telemetry.byProject(since),
      api().telemetry.ranking(since, TOP_AGENTS),
      api().scan.historySince(since)
    ])
    usePerformanceStore.getState().setData({ usage, byProject, ranking, scans })
  } catch {
    usePerformanceStore.getState().setLoading(false)
  }
}
