import { app } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { AppContext } from '@application/context'
import { importarAtendidos, type ResumenImport } from '@application/system/importar-atendidos'
import { err, ok, type Result } from '@domain/shared/result'

const FICHERO = 'atendidos.json'

/**
 * Lee el registro que quien trabajo el backlog dejo al lado del export, y lo
 * asienta. Es el primer camino fichero -> base del proyecto: hasta ahora se leian
 * ficheros (git-info, dependencias) o se escribian (el record, el export), pero
 * ninguno cerraba el circulo.
 *
 * El fichero NO se toca: ni se borra ni se reescribe. Es el registro y el
 * respaldo del backlog a la vez, y consumirlo destruiria la mitad de su razon
 * de ser. Reimportarlo es idempotente, asi que dejarlo ahi no estorba.
 *
 * Que no exista NO es un fallo del sistema sino del orden de los pasos, y se
 * dice asi: el operador tiene que saber que le falta escribirlo, no creer que
 * algo se rompio.
 */
export function importAttended(context: AppContext): Result<ResumenImport> {
  const origen = join(app.getPath('userData'), FICHERO)
  let contenido: string
  try {
    contenido = readFileSync(origen, 'utf8')
  } catch {
    return err(`No hay nada que importar: falta ${origen}`)
  }
  return ok(importarAtendidos(context, contenido))
}
