import { app } from 'electron'
import { appendFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { redactSecrets } from '@domain/chat/tool-detail'

const CARPETA = 'error-logs'
const FICHERO = 'fallos.log'

/**
 * La OTRA lectura del mismo fallo (ADR-086). La observacion se queda con la
 * clase —`FORTRESS rompio durante X: SqliteError`— porque viaja; aqui va el
 * error entero, con su `message` y su stack, porque NO viaja: vive en
 * `userData`, junto a `fortress.db` y a los `scan-logs`, y nadie lo exporta.
 *
 * Es el molde de `lectura-del-denial`: `describeDenial` le da al operador el
 * comando completo con sus rutas, `nombreDeHerramienta` le da a FORTRESS lo
 * unico que puede aprender sin filtrar. Sin este fichero, decidir no guardar el
 * `message` seria perderlo; con el, es solo no dejarlo salir.
 *
 * Se TACHAN los secretos igual que en `write-scan-log`: local no es lo mismo que
 * publico, y una API key en un fichero de texto sigue siendo una API key.
 */
function destino(): string {
  const carpeta = join(app.getPath('userData'), CARPETA)
  mkdirSync(carpeta, { recursive: true })
  return join(carpeta, FICHERO)
}

function comoTexto(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}\n${error.stack ?? ''}`
  return String(error)
}

/**
 * Mejor esfuerzo CON constancia, y aqui con un motivo extra: esto corre DENTRO
 * del manejador de un fallo. Si escribir en disco lanzara, el fallo original se
 * perderia detras del fallo de registrarlo — un error no puede multiplicarse
 * por el intento de anotarlo.
 */
export function registrarFallo(cuando: string, operacion: string, error: unknown): void {
  try {
    const linea = `[${cuando}] ${operacion}\n${comoTexto(error)}\n\n`
    appendFileSync(destino(), redactSecrets(linea), 'utf8')
  } catch {
    // Silencio deliberado: ver arriba.
  }
}
