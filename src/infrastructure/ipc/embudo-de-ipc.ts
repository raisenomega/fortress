import { fileURLToPath } from 'url'
import { idDeProyectoEnArgs, observacionDeFalloDeIpc } from '@domain/system/observacion-de-ipc'
import { conRed, nombreDelError, type SumideroDeFallos } from '../system/red-del-embudo'

export type Manejador = (event: unknown, ...args: unknown[]) => unknown

/** Lo minimo de `ipcMain`: tiparlo, y no importarlo, deja probar sin Electron. */
export interface RegistradorIpc {
  handle: (canal: string, manejador: Manejador) => void
}

/** En la funcion envuelta: envolver dos veces duplicaria cada control. */
const MARCA = Symbol.for('fortress.embudo-de-ipc')
const MARCA_ORIGEN = Symbol.for('fortress.origen-de-ipc')
type Handle = RegistradorIpc['handle'] & { [MARCA]?: true; [MARCA_ORIGEN]?: true }
type FrameQueLlama = { readonly url: string; readonly parent: unknown } | null | undefined
export type InterfazPropia = { readonly indexHtml: string; readonly devUrl: string | undefined }

export function capturarFalloDeIpc(
  sumidero: SumideroDeFallos,
  canal: string,
  args: readonly unknown[],
  error: unknown
): void {
  const nota = observacionDeFalloDeIpc(canal, nombreDelError(error))
  conRed(sumidero, `el canal ${canal}`, nota, error, idDeProyectoEnArgs(args))
}

/** Solo el frame PRINCIPAL de la interfaz propia; uno destruido (null) no. El file://
 *  va por ruta decodificada: el mount FUSE del AppImage cambia en cada arranque. */
export function esFrameDeConfianza(event: unknown, propia: InterfazPropia): boolean {
  try {
    const frame = (event as { senderFrame?: FrameQueLlama } | null)?.senderFrame
    if (frame == null || frame.parent !== null) return false
    if (propia.devUrl) return new URL(frame.url).origin === new URL(propia.devUrl).origin
    return fileURLToPath(frame.url) === propia.indexHtml
  } catch {
    return false
  }
}

/** Embudo (ADR-086, embudo 2): envuelve el REGISTRO en la raiz y cubre los 110 sin abrir
 *  los 36 ficheros. OBSERVA, NO INTERCEPTA: relanza el objeto identico. Sin el `await` se
 *  escapan las promesas rechazadas. No ve los 16 que convierten su `throw` en `err()`. */
export function envolverRegistroIpc(registrador: RegistradorIpc, sumidero: SumideroDeFallos): void {
  const actual = registrador.handle as Handle
  if (actual[MARCA] === true) return
  const original = actual.bind(registrador)
  const envuelto: Handle = (canal, manejador) =>
    original(canal, async (event, ...args) => {
      try {
        return await manejador(event, ...args)
      } catch (error) {
        capturarFalloDeIpc(sumidero, canal, args, error)
        throw error
      }
    })
  envuelto[MARCA] = true
  registrador.handle = envuelto
}

/** Control de ORIGEN (Electron, defensa en profundidad): se instala ANTES que el embudo,
 *  queda por fuera, y un rechazo va al renderer sin asentarse como fallo en fallos.log. */
export function exigirOrigenPropio(registrador: RegistradorIpc, propia: InterfazPropia): void {
  const actual = registrador.handle as Handle
  if (actual[MARCA_ORIGEN] === true) return
  const original = actual.bind(registrador)
  const envuelto: Handle = (canal, manejador) =>
    original(canal, (event, ...args) => {
      if (esFrameDeConfianza(event, propia)) return manejador(event, ...args)
      throw new Error(`IPC ${canal} rechazado: no llama la interfaz propia`)
    })
  envuelto[MARCA_ORIGEN] = true
  registrador.handle = envuelto
}
