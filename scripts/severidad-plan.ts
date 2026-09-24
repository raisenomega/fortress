import Database from 'better-sqlite3'
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { planDeRestauracion } from '../src/domain/project/restauracion-de-severidad.ts'
import { leerFilasDeFamilia, leerNotasDeSeveridad } from '../src/infrastructure/persistence/restaurar-severidad.ts' // prettier-ignore
import { leerArgumentos } from './fase-b-argumentos.ts'
import { textoDelPlan } from './severidad-plan-texto.ts'

// Restauracion de ADR-103 §3, paso a: el plan, sin escribir. Abre la base en
// solo lectura, lee las vivas de familia y las notas «Severidad por ejes» del
// Libro, y deja el plan en internal/ para aprobarlo. Uso:
//   npm run severidad:plan -- <proyecto> [--base <ruta>]
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
const RUTA = base ?? join(homedir(), '.config/fortress-command-center/fortress.db')
const db = new Database(RUTA, { readonly: true })
const p = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as { id: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${RUTA}`)

const filas = leerFilasDeFamilia(db, p.id)
const notas = leerNotasDeSeveridad(db, p.id)
if (notas.length === 0) throw new Error(`${proyecto}: sin notas «Severidad por ejes» en el Libro; nada que restaurar`) // prettier-ignore
const { plan, excluidas } = planDeRestauracion(filas, notas)
db.close()

const texto = textoDelPlan(proyecto, RUTA, plan, excluidas)
console.log(texto.join('\n'))
const SALIDA = join(process.cwd(), 'internal', `severidad-${proyecto}.json`)
writeFileSync(SALIDA, JSON.stringify({ proyecto, base: RUTA, vivasDeFamilia: filas.length, notas: notas.length, plan, excluidas }, null, 2)) // prettier-ignore
writeFileSync(
  join(process.cwd(), 'internal', `severidad-plan-${proyecto}.txt`),
  texto.join('\n') + '\n'
)
console.log(`\nPlan guardado en ${SALIDA}. Nada escrito en la base.`)
