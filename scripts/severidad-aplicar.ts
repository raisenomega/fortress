import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { planDeRestauracion, type Restauracion } from '../src/domain/project/restauracion-de-severidad.ts' // prettier-ignore
import { leerFilasDeFamilia, leerNotasDeSeveridad, restaurarSeveridad } from '../src/infrastructure/persistence/restaurar-severidad.ts' // prettier-ignore
import { appCerrada } from './app-cerrada.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'

// Restauracion de ADR-103 §3, paso b: aplica el plan aprobado en UNA
// transaccion. Exige --base explicita y la app cerrada; el plan que la base
// pide HOY tiene que ser exactamente el del JSON, o no se escribe nada. Uso:
//   npm run severidad:aplicar -- <proyecto> --base <ruta>
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
if (base === null) throw new Error('fail-closed: --base es obligatoria; ensaya sobre una copia antes de nombrar la viva') // prettier-ignore
if (!appCerrada())
  throw new Error('fail-closed: la app esta abierta; cierrala antes de escribir su base')
interface Datos { readonly proyecto: string; readonly plan: readonly Restauracion[] } // prettier-ignore
const datos = JSON.parse(readFileSync(join(process.cwd(), 'internal', `severidad-${proyecto}.json`), 'utf8')) as Datos // prettier-ignore
if (datos.proyecto !== proyecto)
  throw new Error(`el JSON es de ${datos.proyecto}, no de ${proyecto}`)

const db = new Database(base)
const p = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as { id: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${base}`)

const firma = (r: Restauracion): string => `${r.id}|${r.de}|${r.a}`
const hoy = planDeRestauracion(leerFilasDeFamilia(db, p.id), leerNotasDeSeveridad(db, p.id)).plan
const enBase = new Set(hoy.map(firma))
const enJson = new Set(datos.plan.map(firma))
if (enBase.size !== enJson.size || [...enJson].some((f) => !enBase.has(f)))
  throw new Error(`fail-closed: el plan que la base pide hoy (${hoy.length}) no es el del JSON (${datos.plan.length}); vuelve a planificar`) // prettier-ignore

const RANGO: Readonly<Record<string, number>> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }
const suben = datos.plan.filter((r) => RANGO[r.a] > RANGO[r.de]).length
const n = restaurarSeveridad(db, datos.plan)
const queda = planDeRestauracion(leerFilasDeFamilia(db, p.id), leerNotasDeSeveridad(db, p.id)).plan.length // prettier-ignore
db.close()
console.log(`COMMIT sobre ${base}. restauradas=${n} (suben ${suben}, bajan ${n - suben}) · plan pendiente tras aplicar: ${queda}`) // prettier-ignore
