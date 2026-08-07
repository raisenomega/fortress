import { ipcMain } from 'electron'
import { readGenesisBudget } from '@application/settings/read-genesis-budget'
import { GRAPH_REQUIRED_MSG } from '@domain/graph/require-graph'
import { genesisConfigured } from '@domain/settings/genesis-budget'
import { err, ok, type Result } from '@domain/shared/result'
import { startGenesis, stopGenesis } from '../genesis/genesis-controller'
import { selfGraphMissing } from '../graph/self-graph'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

/**
 * IPC del bucle de genesis: encender/apagar. Encender exige topes guardados
 * (freno duro). El estado se EMPUJA por IPC.systemGenesisStatus desde el engine.
 */
export function registerGenesisHandlers(): void {
  ipcMain.handle(IPC.systemGenesisToggle, (_event, on: boolean): Result<null> => {
    if (!on) {
      stopGenesis()
      return ok(null)
    }
    if (!genesisConfigured(readGenesisBudget(getAppContext()))) {
      return err('Fija los topes de genesis en Configuracion antes de encender')
    }
    if (selfGraphMissing(getAppContext())) return err(GRAPH_REQUIRED_MSG)
    startGenesis()
    return ok(null)
  })
}
