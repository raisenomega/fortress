import Database from 'better-sqlite3'
import { leerVivasDeHoy } from '../src/infrastructure/persistence/filas-con-identidad-vieja.ts'
import { RECLASIFICAR_FINDING } from '../src/infrastructure/persistence/finding-fusion-sql.ts'
import {
  MARK_EXTINCT,
  MARK_MITIGATED
} from '../src/infrastructure/persistence/finding-lifecycle-sql.ts'
import { ANOTAR_VERIFICACION } from '../src/infrastructure/persistence/finding-verificacion-sql.ts'
import { fundirEnCaliente } from '../src/infrastructure/persistence/fundir-en-caliente.ts'
import { redDeLaFusion } from '../src/infrastructure/persistence/red-de-la-fusion.ts'
import { appCerrada } from './app-cerrada.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'
import { planAprobado } from './fase-b-paso-b-datos.ts'

// Paso B, 2b: aplica el JSON revisado en UNA transaccion. Exige --base explicita
// y la app cerrada. El veredicto se RECALCULA contra el fichero de hoy y tiene
// que coincidir con el JSON; las fusiones que la base pide tienen que ser las
// del plan aprobado. Si algo no cuadra, no se escribe nada.
// Uso: npm run fase-b:aplicar -- <proyecto> --base <ruta>
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
if (base === null) throw new Error('fail-closed: --base es obligatoria; ensaya sobre una copia antes de nombrar la viva') // prettier-ignore
if (!appCerrada())
  throw new Error('fail-closed: la app esta abierta; cierrala antes de escribir su base')

const db = new Database(base)
const p = db.prepare('SELECT id, path FROM projects WHERE name = ?').get(proyecto) as { id: string; path: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${base}`)
const { veredictos, fusiones } = planAprobado(proyecto, db, p)

// Exentas del criterio 2: las que el escaner de hoy dejo en 'otro' legitimamente
// —5 en mailbd; el ensayo del 2026-09-22 paro por ellas— y las juzgadas 'otro'.
// Se leen ANTES de reclasificar, como en el paso A.
const otroLegitimo = leerVivasDeHoy(db, p.id).filter((v) => v.tipo === 'otro').map((v) => v.id) // prettier-ignore
const exentas = [...otroLegitimo, ...veredictos.filter((v) => v.desenlace !== 'sin_decidir' && v.tipo === 'otro').map((v) => v.id)] // prettier-ignore

const at = new Date().toISOString()
const extinguir = db.prepare(MARK_EXTINCT),
  mitigar = db.prepare(MARK_MITIGATED)
const reclasificar = db.prepare(RECLASIFICAR_FINDING),
  anotar = db.prepare(ANOTAR_VERIFICACION)
const vivas = (): number => (db.prepare(`SELECT COUNT(*) n FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`).get(p.id) as { n: number }).n // prettier-ignore
const antes = vivas()
const conteo = { extinguida: 0, sin_prueba: 0, real: 0 }
const pasoB = db.transaction((): number => {
  for (const v of veredictos) {
    if (v.desenlace === 'sin_decidir') continue
    reclasificar.run({ id: v.id, identity: v.identidad_nueva, tipo: v.tipo, simbolo: v.simbolo })
    if (v.desenlace === 'extinguida')
      extinguir.run({ id: v.id, at, motivo: 'juicio_obsoleto', extinguidoPor: 'agente' })
    if (v.desenlace === 'sin_prueba') { mitigar.run({ id: v.id, at, note: v.nota }); anotar.run({ id: v.id, note: v.nota }) } // prettier-ignore
    conteo[v.desenlace] += 1
  }
  const fundidas = fundirEnCaliente(db, p.id, fusiones)
  const violaciones = redDeLaFusion(db, p.id, exentas)
  if (violaciones.length > 0) throw new Error(`la migracion no cuadra:\n${violaciones.map((x) => `  criterio ${x.criterio}: ${x.quien} — ${x.detalle}`).join('\n')}`) // prettier-ignore
  return fundidas.length
})
const fundidas = pasoB()
console.log(
  `COMMIT sobre ${base}. ${JSON.stringify(conteo)} fusiones=${fundidas} · vivas de ${proyecto}: ${antes} -> ${vivas()}`
)
db.close()
