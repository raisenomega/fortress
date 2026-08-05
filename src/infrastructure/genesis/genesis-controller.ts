import { getAppContext } from '../persistence/app-context'
import { runGenesisEngine } from './genesis-engine'
import { cancelGenesis, clearGenesis, isGenesisRunning, markGenesisRunning } from './genesis-registry'

/** Arranca el bucle de genesis si no corre ya. Fire-and-forget; se limpia al terminar. */
export function startGenesis(): void {
  if (isGenesisRunning()) return
  markGenesisRunning()
  void runGenesisEngine(getAppContext()).finally(clearGenesis)
}

/** Parada de emergencia humana: marca cancelado; el ciclo lo consulta entre episodios. */
export function stopGenesis(): void {
  cancelGenesis()
}
