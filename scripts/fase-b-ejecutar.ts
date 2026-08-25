import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { identidadFusionada, planDeFusion } from '../src/domain/project/fusion-de-duplicados.ts'
import { MARCAR_FUSIONADA, RECLASIFICAR_FINDING } from '../src/infrastructure/persistence/finding-fusion-sql.ts' // prettier-ignore
import { verificarEnCaliente } from './fase-b-verificar.ts'

// Pieza 2b: reclasifica las filas del JSON y fusiona lo que empate, en UNA
// transaccion. NO llama al modelo — consume la clasificacion ya revisada, asi
// que no hay red en la seccion critica. Exige app cerrada y backup: escribe.
interface Clasificada {
  readonly id: string
  readonly tipo: string
  readonly simbolo: string
  readonly identidad_nueva: string
}

const PROYECTO = 'fortress-command-center'
const datos = JSON.parse(readFileSync('internal/fase-b-clasificacion.json', 'utf8')) as { clasificadas: Clasificada[] } // prettier-ignore
// Por defecto la base del operador; un argumento permite ensayar sobre una copia
// antes de tocarla. El defecto es el real para que olvidarlo no apunte a otra parte.
const RUTA = process.argv[2] ?? join(homedir(), '.config/fortress-command-center/fortress.db')
const db = new Database(RUTA)
const proyecto = (db.prepare('SELECT id FROM projects WHERE name = ?').get(PROYECTO) as { id: string }).id // prettier-ignore

const vivasAntes = (): number =>
  (db.prepare(`SELECT COUNT(*) n FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`).get(proyecto) as { n: number }).n // prettier-ignore
const antes = vivasAntes()
// La que quedo en 'otro' es la CSP obsoleta: se le escribe su identidad nueva y
// nada mas. No le falta un tipo, le falta juicio — y juzgar es del motor.
const exentas = datos.clasificadas.filter((c) => c.tipo === 'otro').map((c) => c.id)

const reclasificarUna = db.prepare(RECLASIFICAR_FINDING)
const marcar = db.prepare(MARCAR_FUSIONADA)
let absorbidas = 0
const fusiones: string[] = []

const faseB = db.transaction(() => {
  for (const c of datos.clasificadas) {
    reclasificarUna.run({ id: c.id, identity: c.identidad_nueva, tipo: c.tipo, simbolo: c.simbolo })
  }

  // Sobre TODAS las vivas, no solo las 17: las contrapartidas del escaner estan
  // fuera del JSON y son la mitad de las fusiones que hay que hacer.
  const vivas = db
    .prepare(
      `SELECT id, identity AS identidad, first_seen AS firstSeen FROM findings
       WHERE project_id = ? AND lifecycle != 'EXTINCT'`
    )
    .all(proyecto) as { id: string; identidad: string; firstSeen: string }[]

  for (const fusion of planDeFusion(vivas)) {
    fusiones.push(`${fusion.absorbidas.length + 1}->1  ${fusion.identidad}`)
    for (const id of fusion.absorbidas) {
      // El payload a mano, como en `toTouch`: la sentencia pide `@identity`.
      const identity = identidadFusionada(fusion.ganadora, fusion.identidad)
      marcar.run({ id, motivo: `fusionada-con-${fusion.ganadora}`, identity })
      absorbidas += 1
    }
  }

  verificarEnCaliente(db, proyecto, exentas)
})

faseB()
console.log(`COMMIT. reclasificadas=${datos.clasificadas.length} fusiones=${fusiones.length} absorbidas=${absorbidas}`) // prettier-ignore
for (const f of fusiones) console.log('  ' + f)
console.log(`vivas: ${antes} -> ${vivasAntes()}`)
