import { app } from 'electron'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import type { ModuloAuditoria } from '@domain/scan/modulo-auditoria'

/**
 * En `userData`, junto a `fortress.db`, los worktrees del motor y los
 * `scan-logs`. Es el patron cerebro/ejecutor de ADR-083: la doctrina es del
 * operador y viaja con el; el binario no la lleva dentro —`electron-builder`
 * excluye `internal/**` a proposito (ADR-058)— y ademas, instalado, no sabe
 * donde esta el repo.
 */
const CARPETA = 'audit-kit'

/** `PLANTILLA_MODULO_M8_INTEGRIDAD_NEGOCIO.md`. El `_` final del prefijo evita
 *  que `M1` se lleve por delante a `M10`, `M11` y `M12`. */
const prefijoDe = (modulo: ModuloAuditoria): string => `PLANTILLA_MODULO_${modulo}_`

/**
 * La plantilla de un modulo tal y como el operador la sembro, o null si no
 * esta. Por nombre PARCIAL y no exacto: el sufijo tematico del kit
 * (`_INTEGRIDAD_NEGOCIO`) es del documento, y obligar a FORTRESS a conocerlo
 * seria una segunda lista que diverge de la carpeta el dia que una plantilla
 * se renombre.
 *
 * Que no esten NO es un fallo del sistema sino del orden de los pasos: el
 * escaneo sigue con la checklist de siempre y no revienta. Es la doctrina de
 * `import-attended`, que dice lo mismo del registro de atendidos.
 */
export function leerPlantilla(modulo: ModuloAuditoria): string | null {
  const carpeta = join(app.getPath('userData'), CARPETA)
  try {
    const fichero = readdirSync(carpeta).find((n) => n.startsWith(prefijoDe(modulo)))
    return fichero === undefined ? null : readFileSync(join(carpeta, fichero), 'utf8')
  } catch {
    // Sin carpeta sembrada no hay nada que leer, y no es una averia.
    return null
  }
}
