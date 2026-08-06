import { getAppContext } from '../persistence/app-context'
import { runGenesisEngine } from './genesis-engine'
import {
  clearGenesis,
  isGenesisRunning,
  markGenesisRunning,
  stopGenesisRun
} from './genesis-registry'

/** Arranca el bucle si no corre ya. Fire-and-forget; libera su token al terminar. */
export function startGenesis(): void {
  if (isGenesisRunning()) return
  const token = markGenesisRunning()
  void runGenesisEngine(getAppContext(), token).finally(() => clearGenesis(token))
}

/** Parada de emergencia humana: AUTORITATIVA (activeToken=0). El ciclo la ve entre episodios. */
export function stopGenesis(): void {
  stopGenesisRun()
}
