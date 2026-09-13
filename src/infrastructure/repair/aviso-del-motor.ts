import { BrowserWindow } from 'electron'
import { IPC } from '../ipc/channels'

/**
 * El golpecito en el hombro del carril del motor: «el expediente de ese proyecto
 * se movio». Se manda SOLO el id, como el reindexado del grafo; quien escucha
 * relee de la base. Mandar el estado entero seria una segunda copia del mismo
 * hecho viajando por el puente, con su propio momento de quedarse vieja.
 *
 * Sale para CUALQUIER proyecto, tambien los que el operador no tiene delante:
 * filtrar aqui dejaria al motor trabajando a oscuras sobre los demas, y quien
 * pinta ya decide si le toca.
 *
 * Vive suelto y no dentro de `createRepairNotifier` porque hay dos emisores y
 * solo uno tiene propuesta: el expediente avisa por `proposalId`, y el barrido
 * de mitigados no crea ninguna propuesta (ADR-087) pero mueve la misma tabla y
 * gasta del mismo bolsillo. Con el aviso atado a la propuesta, verificar en
 * masa habria gastado en silencio con el pie ensenando la cifra de arranque.
 */
export function avisarDelMotor(projectId: string): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send(IPC.repairChanged, projectId)
  }
}
