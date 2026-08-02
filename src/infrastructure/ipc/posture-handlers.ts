import { ipcMain } from 'electron'
import { runPosture } from '@application/posture/run-posture'
import type { PostureRequest } from '@domain/posture/posture-scan'
import { err } from '@domain/shared/result'
import { createClaudePostureScanner } from '../posture/claude-posture-scanner'
import { IPC } from './channels'

const scanner = createClaudePostureScanner()

export function registerPostureHandlers(): void {
  ipcMain.handle(IPC.postureRun, async (_event, request: PostureRequest) => {
    try {
      return await runPosture(scanner, request)
    } catch (error) {
      return err(error instanceof Error ? error.message : 'Fallo al auditar el sitio')
    }
  })
}
