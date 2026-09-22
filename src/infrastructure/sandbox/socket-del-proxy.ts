import { mkdtempSync, rmdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

/** Un socket nuevo para un proxy, en una carpeta 0700 SOLO del operador (la crea
 *  `mkdtemp`), fuera de la caja: dentro se ve por otra ruta y en solo lectura. */
export const socketNuevo = (): string => join(mkdtempSync(join(tmpdir(), 'fortress-proxy-')), 'p.sock') // prettier-ignore

/** Tras `cerrar` el proxy queda la carpeta vacia: se retira. Con algo dentro, no. */
export function retirarSocket(socket: string): void {
  try {
    rmdirSync(dirname(socket))
  } catch {
    /* no vacia o ya retirada: se queda como esta */
  }
}
