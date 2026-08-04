import { powerSaveBlocker } from 'electron'

let blockerId: number | null = null

/**
 * Impide que la pantalla se apague mientras los agentes trabajan. Usa el
 * powerSaveBlocker de Electron ('prevent-display-sleep'): la app se queda
 * visible sin depender de los ajustes de energia del sistema.
 */
export function setKeepAwake(enable: boolean): void {
  if (enable) {
    if (blockerId === null || !powerSaveBlocker.isStarted(blockerId)) {
      blockerId = powerSaveBlocker.start('prevent-display-sleep')
    }
    return
  }

  if (blockerId !== null) {
    if (powerSaveBlocker.isStarted(blockerId)) powerSaveBlocker.stop(blockerId)
    blockerId = null
  }
}
