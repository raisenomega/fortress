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
 * Auditoria integral de las 6 dimensiones. Async (spawn): no congela la ventana.
 *
 * `guardRun` comprueba lo que su nombre dice y nada mas: proyecto contaminado,
 * tope diario de gasto y otra corrida en curso. NO mira la confianza ni el repo
 * propio — este comentario lo afirmaba y era falso. Esa creencia es la que dejo
 * al gate del motor ejecutando `npm ci` de repos ajenos desde que nacio hasta
 * que un escaneo del propio FORTRESS lo encontro.
 *
 * La guarda de confianza de esta ruta vive una capa mas abajo, en `auditQuality`:
 * sin `trusted` no corre los probes, y las dimensiones que dependian de ellos
 * quedan sin datos con el global marcado PARCIAL. No bloquea la auditoria:
 * audita lo que puede saber sin ejecutar codigo del repo.
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
