import { app } from 'electron'
import { writeFileSync } from 'fs'
import { join } from 'path'
import type { AppContext } from '@application/context'
import { buildObservationExport } from '@domain/system/observation-export'
import { nowIso } from '@domain/shared/id'
import { err, ok, type Result } from '@domain/shared/result'

const FICHERO = 'auto-mejora.json'

/**
 * Deja el backlog de auto-mejora en un fichero que se pueda TRABAJAR desde
 * fuera. Existe porque el backlog llevaba trescientas cuarenta observaciones y
 * cero atendidas: no faltaba una pantalla mas bonita, faltaba poder actuar.
 *
 * Va a `userData`, junto a la base y a los worktrees del motor, y no a la
 * carpeta de un proyecto: estas observaciones son sobre FORTRESS, no sobre el
 * proyecto donde se descubrieron.
 *
 * A diferencia del record de un proyecto, aqui el fallo SI se cuenta: aquel se
 * escribia de camino a borrar y perderlo no podia frenar el borrado; este es el
 * acto entero, y decir que se exporto cuando no se pudo seria mentir sobre lo
 * unico que el operador vino a hacer.
 */
export function exportObservations(context: AppContext): Result<string> {
  const destino = join(app.getPath('userData'), FICHERO)
  try {
    const backlog = buildObservationExport(context.selfObservations.listOpen(), nowIso())
    writeFileSync(destino, `${JSON.stringify(backlog, null, 2)}\n`)
    return ok(destino)
  } catch (error) {
    return err(`No se pudo escribir ${destino}: ${(error as Error).message}`)
  }
}
