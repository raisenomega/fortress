import { ipcMain } from 'electron'
import { runQualityAudit } from '@application/score/run-quality-audit'
import type { IntegralScore } from '@domain/score/integral-score'
import { err, type Result } from '@domain/shared/result'
import { probeAuditor } from '../probe/audit-quality'
import { getAppContext } from '../persistence/app-context'
import { guardRun } from '../run-guard'
import { endRun } from '../run-control'
import { IPC } from './channels'

/**
 * Auditoria integral de las 6 dimensiones. Corre probes (tsc/lint/build/test/audit)
 * que ejecutan codigo del repo: pasa por `guardRun` (bloquea el repo propio y los
 * no-confiables) igual que el escaneo. Async (spawn): no congela la ventana.
 */
async function handleRun(projectId: string): Promise<Result<IntegralScore>> {
  const context = getAppContext()
  const denegado = guardRun(context, projectId)
  if (denegado !== null) return err(denegado)
  try {
    return await runQualityAudit(context, probeAuditor, projectId)
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Fallo inesperado al auditar')
  } finally {
    endRun(projectId)
  }
}

export function registerQualityHandlers(): void {
  ipcMain.handle(IPC.qualityRun, (_event, projectId: string) => handleRun(projectId))
}
