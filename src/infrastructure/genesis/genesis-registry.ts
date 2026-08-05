import type { BrowserWindow } from 'electron'
import type { GenesisStatus } from '@domain/system/genesis-status'
import { IPC } from '../ipc/channels'

/**
 * Estado del bucle de genesis (global, una instancia). El "token" hace la parada
 * AUTORITATIVA: parar pone activeToken=0 y ninguna corrida con otro token puede
 * seguir; un arranque nuevo toma un token fresco y cualquier corrida vieja se
 * autodetiene. Asi la parada no se puede deshacer (el bug del modelo booleano).
 */
let activeToken = 0
let started = 0
let win: BrowserWindow | null = null

export function bindGenesisWindow(window: BrowserWindow): void {
  win = window
}

export function isGenesisRunning(): boolean {
  return activeToken !== 0
}

/** Reserva un token para una corrida nueva y lo marca como el unico activo. */
export function markGenesisRunning(): number {
  started += 1
  activeToken = started
  return started
}

/** Parada humana: ninguna corrida es "la activa" -> todas se detienen. */
export function stopGenesisRun(): void {
  activeToken = 0
}

/** Cancelado si esta corrida ya no es la activa (parada o reemplazada). */
export function isGenesisCancelled(token: number): boolean {
  return token !== activeToken
}

/** Libera solo si sigue siendo la corrida activa (no pisa una mas nueva). */
export function clearGenesis(token: number): void {
  if (activeToken === token) activeToken = 0
}

export function sendGenesisStatus(status: GenesisStatus): void {
  if (win && !win.isDestroyed()) win.webContents.send(IPC.systemGenesisStatus, status)
}

/** Espera ms, cortando en cuanto la corrida deja de ser la activa. */
export async function waitOrCancel(ms: number, token: number): Promise<void> {
  const step = 250
  for (let waited = 0; waited < ms && !isGenesisCancelled(token); waited += step) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(step, ms - waited)))
  }
}
