import Database from 'better-sqlite3'
import { homedir } from 'os'
import { join } from 'path'
import { supervivientesDegradadas, type Pareja } from '../src/domain/project/severidad-al-fundir.ts' // prettier-ignore
import { masUrgente } from '../src/domain/shared/severity.ts'
import { leerVictimas, repararGravedad } from '../src/infrastructure/persistence/reparar-gravedad.ts' // prettier-ignore
import { puedeAplicar } from '../src/infrastructure/persistence/reparar-gravedad-guardas.ts'
import { appCerrada } from './app-cerrada.ts'
import { salidaDelPlan } from './reparar-gravedad-salida.ts'

/**
 * Repara los grupos que se fundieron ANTES de que la regla de la gravedad
 * existiera. No lleva la lista de victimas dentro: las ENCUENTRA con la misma
 * autoridad que usa la fusion, asi que si hubiera mas de las que alguien cree,
 * salen igual.
 *
 * Dos modos, y el que escribe hay que pedirlo: por defecto imprime el plan con
 * la base en `readonly`. `--aplicar` exige la app CERRADA y un backup DE VERDAD
 * —SQLite legible, integro y con las filas que se van a tocar dentro—, porque
 * escribe en la base del operador: la misma disciplina que `install.sh`.
 *
 * Las dos condiciones no se comprueban aqui sino en `repararGravedad`, pegadas a
 * la transaccion: comprobarlas al arrancar el proceso y escribir despues deja una
 * ventana en la que el mundo cambia — la app se cierra o se abre en medio.
 *
 * Uso:  node scripts/reparar-gravedad.ts --proyecto <nombre> [--base <ruta>]
 *       node scripts/reparar-gravedad.ts --proyecto <nombre> --aplicar --backup <ruta>
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
const aplicar = process.argv.includes('--aplicar')
const ruta = arg('--base') ?? join(homedir(), '.config/fortress-command-center/fortress.db')

const db = new Database(ruta, { readonly: !aplicar })
const proyectoId = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as
  { id: string } | undefined
if (proyectoId === undefined) salir(`No hay ningun proyecto llamado "${proyecto}" en ${ruta}`)

const victimasDe = (p: readonly Pareja[]): ReturnType<typeof supervivientesDegradadas> =>
  supervivientesDegradadas(p, masUrgente)

if (!aplicar) {
  const victimas = leerVictimas(db, proyectoId!.id, victimasDe)
  for (const linea of salidaDelPlan(db, proyecto, victimas)) console.log(linea)
  db.close()
} else {
  const backup = arg('--backup') ?? salir('Falta --backup <ruta>: no se escribe sin backup.')
  try {
    const permiso = (v: Parameters<typeof puedeAplicar>[0], n: number): ReturnType<typeof puedeAplicar> => puedeAplicar(v, n, backup, appCerrada) // prettier-ignore
    const reparadas = repararGravedad(db, proyectoId!.id, victimasDe, permiso)
    for (const v of reparadas) console.log(`  ${v.id}: ${v.viva} -> ${v.maxima}`)
    console.log(`COMMIT. reparadas=${reparadas.length}`)
  } catch (error) {
    salir(`NO se escribio nada — ${(error as Error).message}`)
  } finally {
    db.close()
  }
}
