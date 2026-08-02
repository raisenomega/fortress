import { api } from '../adapters/fortress-api'
import { useTelemetryStore } from '../stores/telemetry-store'

/**
 * Relee el consumo de la sesion. Se llama despues de cada ejecucion, no en un
 * intervalo: un contador que se refresca solo consume sin que nadie mire.
 */
export async function refreshSessionUsage(): Promise<void> {
  useTelemetryStore.getState().setSession(await api().telemetry.session())
}
