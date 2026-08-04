import { ipcMain } from 'electron'
import { runPosture } from '@application/posture/run-posture'
import type { PostureRequest } from '@domain/posture/posture-scan'
import { err } from '@domain/shared/result'
import { getAppContext } from '../persistence/app-context'
import { createClaudePostureScanner } from '../posture/claude-posture-scanner'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { IPC } from './channels'

const scanner = createClaudePostureScanner()

/** La auditoria de superficie tambien gasta: pasa por el mismo gate (tope
 *  diario + concurrencia) que el escaneo y el chat. Clave sintetica 'posture'
 *  (no colisiona con ids de proyecto, que son uuid). */
const POSTURE_KEY = 'posture'

export function registerPostureHandlers(): void {
  ipcMain.handle(IPC.postureRun, async (_event, request: PostureRequest) => {
    const denegado = guardRun(getAppContext(), POSTURE_KEY)
    if (denegado !== null) return err(denegado)
    try {
      return await runPosture(scanner, request)
    } catch (error) {
      return err(error instanceof Error ? error.message : 'Fallo al auditar el sitio')
    } finally {
      endRun(POSTURE_KEY)
    }
  })
}
