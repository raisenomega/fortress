import { closeSync, fsyncSync, openSync, statSync, writeSync } from 'node:fs'

/** Estado del `-wal` de la base: presente y su tamano. La AGUJA del bug de la X
 *  es ver `closeDb:after` con el `-wal` aun presente —el unlink no se completo—. */
function estadoWal(db: string): string {
  try {
    return `wal=${statSync(`${db}-wal`).size}B`
  } catch {
    return 'wal=no'
  }
}

/**
 * Apunta UN paso del apagado en `${db}.apagado-trace`, SINCRONO y flushado por
 * linea: `openSync`→`writeSync`→`fsyncSync`→`closeSync`. Un log async o con buffer
 * se pierde cuando `app.exit(0)` o un SIGKILL corta a media; este no —cuando la
 * funcion vuelve, la linea ya esta en disco—, asi que la ULTIMA linea del fichero
 * dice DONDE murio el apagado. Es diagnostico: si la traza falla, NO tumba el
 * apagado (el `catch` se traga el error, el cierre sigue).
 */
export function trazarApagado(db: string, paso: string, detalle = ''): void {
  try {
    const cola = detalle === '' ? '' : ` | ${detalle}`
    const linea = `${new Date().toISOString()} | ${paso} | ${estadoWal(db)}${cola}\n`
    const fd = openSync(`${db}.apagado-trace`, 'a')
    try {
      writeSync(fd, linea)
      fsyncSync(fd)
    } finally {
      closeSync(fd)
    }
  } catch {
    // La traza NO debe impedir el cierre: si no se puede escribir, se calla.
  }
}
