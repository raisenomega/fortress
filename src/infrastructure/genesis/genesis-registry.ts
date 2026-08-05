import type { BrowserWindow } from 'electron'
import type { GenesisStatus } from '@domain/system/genesis-status'
import { IPC } from '../ipc/channels'

/** Estado en memoria del bucle de genesis. Es global: una sola instancia. */
let running = false
let cancelled = false
let win: BrowserWindow | null = null

export function bindGenesisWindow(window: BrowserWindow): void {
  win = window
}

export function isGenesisRunning(): boolean {
  return running
}

export function markGenesisRunning(): void {
  running = true
  cancelled = false
}

export function clearGenesis(): void {
  running = false
}

/** Parada de emergencia humana; el ciclo la consulta entre episodios. */
export function cancelGenesis(): void {
  cancelled = true
}

export function isGenesisCancelled(): boolean {
  return cancelled
}

export function sendGenesisStatus(status: GenesisStatus): void {
  if (win && !win.isDestroyed()) win.webContents.send(IPC.systemGenesisStatus, status)
}

/** Espera ms, pero corta antes si el humano cancela: la parada es agil. */
export async function waitOrCancel(ms: number): Promise<void> {
  const step = 250
  for (let waited = 0; waited < ms && !cancelled; waited += step) {
    await new Promise((resolve) => setTimeout(resolve, Math.min(step, ms - waited)))
  }
}
