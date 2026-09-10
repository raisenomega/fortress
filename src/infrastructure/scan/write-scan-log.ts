import { app } from 'electron'
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { redactSecrets } from '@domain/chat/tool-detail'
import type { ScanLogWriter } from '@domain/scan/scan-log'

const CARPETA = 'scan-logs'

/**
 * En `userData`, junto a `fortress.db` y los worktrees del motor. NO en el repo
 * auditado: esto es prosa de un agente sobre codigo ajeno, es de FORTRESS, y
 * dejarlo dentro del proyecto del cliente lo ensuciaria y podria colarse en un
 * commit suyo. Es la diferencia con COGNITION-LOG.md, que si es memoria DEL
 * proyecto y por eso vive en su raiz.
 */
function destino(scanId: string): string {
  const carpeta = join(app.getPath('userData'), CARPETA)
  mkdirSync(carpeta, { recursive: true })
  return join(carpeta, `${scanId}.log`)
}

/**
 * Deja la transcripcion de un escaneo en disco, tachada.
 *
 * ENTERA y de una vez, no por trozo. El tachado en vivo redacta cada chunk
 * segun sale y no puede hacer otra cosa, asi que un secreto partido entre dos
 * trozos no encaja con ningun patron y se pinta; lo que se GUARDA se tacha
 * aparte y sobre el texto completo, que es donde el patron si aparece entero.
 * Son dos protecciones distintas a proposito (ver `en-vivo-tachado`).
 *
 * Mejor esfuerzo: si el disco falla, el escaneo ya esta guardado y perder su
 * transcripcion no lo invalida. Igual que la memoria del proyecto.
 */
export const scanLogWriter: ScanLogWriter = {
  write: (scanId, texto) => {
    try {
      writeFileSync(destino(scanId), redactSecrets(texto), 'utf8')
    } catch {
      // Silencio deliberado: ver arriba.
    }
  }
}
