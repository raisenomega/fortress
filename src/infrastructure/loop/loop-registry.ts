import type { BrowserWindow } from 'electron'
import type { ChatChunk } from '@domain/chat/chat-stream'
import type { LoopStatus } from '@domain/loop/loop-status'
import { IPC } from '../ipc/channels'

/** Estado en memoria de los loops vivos. Aislado por proyecto: una entrada cada uno. */
interface Handle {
  cancelled: boolean
}

const loops = new Map<string, Handle>()
let win: BrowserWindow | null = null

export function bindLoopWindow(window: BrowserWindow): void {
  win = window
}

export function markRunning(projectId: string): void {
  loops.set(projectId, { cancelled: false })
}

export function clearLoop(projectId: string): void {
  loops.delete(projectId)
}

export function isRunning(projectId: string): boolean {
  return loops.has(projectId)
}

export function activeCount(): number {
  return loops.size
}

/** Marca la parada de emergencia; el ciclo la consulta entre fases. */
export function cancelLoop(projectId: string): void {
  const handle = loops.get(projectId)
  if (handle) handle.cancelled = true
}

/** Cancelado si el humano lo paro o si ya no corre (fuera del mapa). */
export function isLoopCancelled(projectId: string): boolean {
  const handle = loops.get(projectId)
  return !handle || handle.cancelled
}

export function sendLoopStatus(status: LoopStatus): void {
  if (win && !win.isDestroyed()) win.webContents.send(IPC.loopStatus, status)
}

/**
 * Reenvia la salida EN VIVO del loop por un canal PROPIO (loop:chunk), no el del
 * chat manual: asi el renderer la pinta siempre, sin depender de haber recibido
 * antes el estado (evita la carrera al reanudar) y sin pisar un chat manual.
 */
export function sendLoopChunk(projectId: string, delta: string): void {
  const chunk: ChatChunk = { projectId, delta }
  if (win && !win.isDestroyed()) win.webContents.send(IPC.loopChunk, chunk)
}

/** Espera ms, pero corta antes si el humano cancela: la parada es agil. */
export async function waitOrCancel(projectId: string, ms: number): Promise<void> {
  const step = 2000
  for (let waited = 0; waited < ms; waited += step) {
    if (isLoopCancelled(projectId)) return
    await new Promise((resolve) => setTimeout(resolve, Math.min(step, ms - waited)))
  }
}
