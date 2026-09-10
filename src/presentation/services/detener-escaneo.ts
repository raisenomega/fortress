import { api } from '../adapters/fortress-api'

/**
 * Detener el recorrido. Marca la cancelacion y corta el proceso en marcha; el
 * recorrido la lee en la frontera de la SIGUIENTE parada, asi que la que corre
 * termina y se guarda. Lo demas lo cierra `runScan` por su camino normal.
 */
export async function stopScan(projectId: string): Promise<void> {
  await api().scan.stop(projectId)
}
