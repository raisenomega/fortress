import { ipcRenderer, type IpcRendererEvent } from 'electron'
import type { Unsubscribe } from './api-types'

/**
 * Suscripcion tipada a un evento del main, con su cancelacion. El listener del
 * renderer no llega a ver el IpcRendererEvent: solo el dato, que es lo unico
 * que necesita y lo unico que deberia poder tocar.
 */
export function subscribe<T>(channel: string, listener: (payload: T) => void): Unsubscribe {
  const handler = (_event: IpcRendererEvent, payload: T): void => listener(payload)
  ipcRenderer.on(channel, handler)

  return () => {
    ipcRenderer.off(channel, handler)
  }
}
