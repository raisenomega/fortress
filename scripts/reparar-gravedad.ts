import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import { supervivientesDegradadas, type Pareja } from '../src/domain/project/severidad-al-fundir.ts' // prettier-ignore
import { masUrgente } from '../src/domain/shared/severity.ts'
import { leerVictimas } from '../src/infrastructure/persistence/reparar-gravedad.ts'
import { salidaDelPlan } from './reparar-gravedad-salida.ts'

/**
 * Que supervivientes quedaron por debajo de su grupo, y que UPDATE los
 * arreglaria. SOLO LEE — y no por descuido: este script NO PUEDE escribir.
 *
 * Tuvo un `--aplicar`, y el 2026-09-06 se alcanzo dos veces en una tarde "para
 * ver si funciona", la primera escribiendo en la base del operador sin backup.
 * Se endurecieron sus guardas —backup real, app cerrada, ventana TOCTOU minima—
 * y aun asi seguian siendo condiciones que el propio proceso evalua. La leccion
 * no fue poner una cerradura mas alta en esa puerta: fue quitar la puerta.
 *
 * Escribir en la base real vuelve a ser un gesto del operador, como `install.sh`
 * o el push al remoto: la maquina NO PUEDE, no es que no deba. Este runner
 * imprime los UPDATE para que los corra una persona, con su backup y su app
 * cerrada, por una via que no vive en este repositorio.
 *
 * Uso:  node scripts/reparar-gravedad.ts --proyecto <nombre> [--base <ruta>]
 */
const arg = (nombre: string): string | undefined => {
  const i = process.argv.indexOf(nombre)
  return i === -1 ? undefined : process.argv[i + 1]
}
const salir = (mensaje: string): never => {
  console.error(mensaje)
  process.exit(2)
}

const proyecto = arg('--proyecto') ?? salir('Falta --proyecto <nombre>. No tiene defecto a proposito.') // prettier-ignore
const ruta = arg('--base') ?? join(homedir(), '.config/fortress-command-center/fortress.db')

// `readonly: true` fijo, sin bandera que lo cambie: SQLite rechaza cualquier
// escritura desde esta conexion, la pida quien la pida.
const db = new Database(ruta, { readonly: true })
const fila = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as
  { id: string } | undefined
if (fila === undefined) salir(`No hay ningun proyecto llamado "${proyecto}" en ${ruta}`)

const victimasDe = (p: readonly Pareja[]): ReturnType<typeof supervivientesDegradadas> =>
  supervivientesDegradadas(p, masUrgente)

for (const linea of salidaDelPlan(db, proyecto, leerVictimas(db, fila!.id, victimasDe))) {
  console.log(linea)
}
db.close()
