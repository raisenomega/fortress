import type { IpcMainInvokeEvent } from 'electron'
import { sinSecretosEnVivo } from '@application/chat/en-vivo-tachado'
import type { ProgresoDelRecorrido } from '@application/scan/progreso-del-recorrido'
import type { ParadaEnCurso, ScanChunk } from '@domain/scan/scan-chunk'
import { IPC } from './channels'

/**
 * Los dos canales del progreso de un escaneo. Emiten solo si la ventana sigue
 * viva: un scan dura minutos.
 *
 * El TEXTO va tachado —es salida de un agente leyendo el repo auditado, igual
 * que el chat, y este canal tiene su propio emisor, por eso no le llegaba el
 * del chat—. La PARADA no: son tres numeros que compone el recorrido a partir
 * del manifiesto, no los escribe ningun modelo, no pueden arrastrar una clave,
 * y meterlos por `sinSecretosEnVivo` obligaria a cambiar la firma de un fichero
 * innegociable sin proteger nada a cambio.
 *
 * Que sean dos funciones y no una con un parametro opcional es lo que hace esa
 * separacion imposible de saltarse por descuido.
 */
export function progresoDeEscaneo(
  event: IpcMainInvokeEvent,
  projectId: string
): ProgresoDelRecorrido {
  const enviar = (chunk: ScanChunk): void => {
    if (event.sender.isDestroyed()) return
    event.sender.send(IPC.scanProgress, chunk)
  }

  return {
    texto: sinSecretosEnVivo((delta: string) => enviar({ projectId, delta })),
    parada: (parada: ParadaEnCurso) => enviar({ projectId, delta: '', parada })
  }
}
