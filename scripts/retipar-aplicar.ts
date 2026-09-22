import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Fusion } from '../src/domain/project/fusion-de-duplicados.ts'
import { leerOtros } from '../src/infrastructure/persistence/filas-otro.ts'
import { RECLASIFICAR_FINDING } from '../src/infrastructure/persistence/finding-fusion-sql.ts'
import { fundirEnCaliente } from '../src/infrastructure/persistence/fundir-en-caliente.ts'
import { redDeLaFusion } from '../src/infrastructure/persistence/red-de-la-fusion.ts'
import { appCerrada } from './app-cerrada.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'
import type { FilaDelRetipado } from './retipar-plan.ts'

// Re-tipado de ADR-100, 2b: aplica el JSON revisado en UNA transaccion. Exige
// --base explicita y la app cerrada; la base tiene que cuadrar con el JSON (las
// mismas vivas en otro) y las fusiones que la base pide con las aprobadas. Si
// algo no cuadra, no se escribe nada. Uso: npm run retipar:aplicar -- <proyecto> --base <ruta>
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
if (base === null) throw new Error('fail-closed: --base es obligatoria; ensaya sobre una copia antes de nombrar la viva') // prettier-ignore
if (!appCerrada())
  throw new Error('fail-closed: la app esta abierta; cierrala antes de escribir su base')
interface Datos { readonly proyecto: string; readonly retipados: readonly FilaDelRetipado[]; readonly fusiones: readonly Fusion[] } // prettier-ignore
const datos = JSON.parse(readFileSync(join(process.cwd(), 'internal', `retipado-${proyecto}.json`), 'utf8')) as Datos // prettier-ignore
if (datos.proyecto !== proyecto)
  throw new Error(`el JSON es de ${datos.proyecto}, no de ${proyecto}`)
if (!Array.isArray(datos.fusiones)) throw new Error('fail-closed: el JSON no trae fusiones')

const db = new Database(base)
const p = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as { id: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${base}`)
const otros = leerOtros(db, p.id)
const ids = new Set(otros.map((o) => o.id))
const faltan = datos.retipados.filter((r) => !ids.has(r.id))
if (faltan.length > 0 || otros.length !== datos.retipados.length) throw new Error(`fail-closed: la base no cuadra con el JSON (${otros.length} en otro, ${datos.retipados.length} veredictos, ${faltan.length} ausentes)`) // prettier-ignore
const sinDecidir = datos.retipados.filter((r) => r.desenlace === 'sin_decidir')
if (sinDecidir.length > 0)
  throw new Error(`fail-closed: ${sinDecidir.length} sin decidir; vuelve a juzgar antes de aplicar`)

const simboloDe = new Map(otros.map((o) => [o.id, o.simbolo]))
const reclasificar = db.prepare(RECLASIFICAR_FINDING)
const cuenta = (sql: string): number => (db.prepare(sql).get(p.id) as { n: number }).n
const VIVAS = `SELECT COUNT(*) n FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`
const OTRO = `${VIVAS} AND tipo = 'otro'`
const antes = { vivas: cuenta(VIVAS), otro: cuenta(OTRO) }
const conteo = { retipada: 0, sigue_otro: 0 }
const retipado = db.transaction((): number => {
  for (const r of datos.retipados) {
    if (r.desenlace === 'sin_decidir') continue
    if (r.desenlace === 'retipada') reclasificar.run({ id: r.id, identity: r.identidad_nueva, tipo: r.tipo, simbolo: simboloDe.get(r.id) ?? null }) // prettier-ignore
    conteo[r.desenlace] += 1
  }
  const fundidas = fundirEnCaliente(db, p.id, datos.fusiones)
  const exentas = datos.retipados.filter((r) => r.desenlace === 'sigue_otro').map((r) => r.id)
  const violaciones = redDeLaFusion(db, p.id, exentas)
  if (violaciones.length > 0) throw new Error(`la migracion no cuadra:\n${violaciones.map((x) => `  criterio ${x.criterio}: ${x.quien} — ${x.detalle}`).join('\n')}`) // prettier-ignore
  return fundidas.length
})
const fundidas = retipado()
console.log(`COMMIT sobre ${base}. ${JSON.stringify(conteo)} fusiones=${fundidas} · vivas de ${proyecto}: ${antes.vivas} -> ${cuenta(VIVAS)} · otro: ${antes.otro} -> ${cuenta(OTRO)}`) // prettier-ignore
db.close()
