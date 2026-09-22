import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createFsProbe } from '../src/infrastructure/omega/fs-probe.ts'
import {
  MARK_EXTINCT,
  MARK_MITIGATED
} from '../src/infrastructure/persistence/finding-lifecycle-sql.ts'
import { RECLASIFICAR_FINDING } from '../src/infrastructure/persistence/finding-fusion-sql.ts'
import { ANOTAR_VERIFICACION } from '../src/infrastructure/persistence/finding-verificacion-sql.ts'
import { redDeLaFusion } from '../src/infrastructure/persistence/red-de-la-fusion.ts'
import { zombisSinGemela } from '../src/infrastructure/persistence/zombis-sin-gemela.ts'
import { appCerrada } from './app-cerrada.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'
import { cuadrarConHoy } from './fase-b-paso-b-cuadre.ts'
import type { FilaDelPasoB } from './fase-b-paso-b-plan.ts'

// Paso B, 2b: aplica el JSON revisado en UNA transaccion. Exige --base explicita
// y la app cerrada. El veredicto se RECALCULA contra el fichero de hoy y tiene
// que coincidir con el JSON: si un fichero cambio entre el plan y la ejecucion,
// no se escribe nada. Uso: npm run fase-b:aplicar -- <proyecto> --base <ruta>
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
if (base === null) throw new Error('fail-closed: --base es obligatoria; ensaya sobre una copia antes de nombrar la viva') // prettier-ignore
if (!appCerrada())
  throw new Error('fail-closed: la app esta abierta; cierrala antes de escribir su base')
interface Datos { readonly proyecto: string; readonly veredictos: readonly FilaDelPasoB[] } // prettier-ignore
const datos = JSON.parse(readFileSync(join(process.cwd(), 'internal', `fase-b-paso-b-${proyecto}.json`), 'utf8')) as Datos // prettier-ignore
if (datos.proyecto !== proyecto)
  throw new Error(`el JSON es de ${datos.proyecto}, no de ${proyecto}`)

const db = new Database(base)
const p = db.prepare('SELECT id, path FROM projects WHERE name = ?').get(proyecto) as { id: string; path: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${base}`)
const zombis = zombisSinGemela(db, p.id)
const ids = new Set(zombis.map((z) => z.id))
const faltan = datos.veredictos.filter((v) => !ids.has(v.id))
if (faltan.length > 0 || zombis.length !== datos.veredictos.length) throw new Error(`fail-closed: la base no cuadra con el JSON (${zombis.length} zombis, ${datos.veredictos.length} veredictos, ${faltan.length} ausentes)`) // prettier-ignore
const sinDecidir = datos.veredictos.filter((v) => v.desenlace === 'sin_decidir')
if (sinDecidir.length > 0)
  throw new Error(`fail-closed: ${sinDecidir.length} sin decidir; vuelve a juzgar antes de aplicar`)
cuadrarConHoy(zombis, datos.veredictos, (f) => createFsProbe().contenido(p.path, f))

const at = new Date().toISOString()
const extinguir = db.prepare(MARK_EXTINCT),
  mitigar = db.prepare(MARK_MITIGATED)
const reclasificar = db.prepare(RECLASIFICAR_FINDING),
  anotar = db.prepare(ANOTAR_VERIFICACION)
const vivas = (): number => (db.prepare(`SELECT COUNT(*) n FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`).get(p.id) as { n: number }).n // prettier-ignore
const antes = vivas()
const conteo = { extinguida: 0, sin_prueba: 0, real: 0 }
const pasoB = db.transaction(() => {
  for (const v of datos.veredictos) {
    if (v.desenlace === 'sin_decidir') continue
    reclasificar.run({ id: v.id, identity: v.identidad_nueva, tipo: v.tipo, simbolo: v.simbolo })
    if (v.desenlace === 'extinguida')
      extinguir.run({ id: v.id, at, motivo: 'juicio_obsoleto', extinguidoPor: 'agente' })
    if (v.desenlace === 'sin_prueba') { mitigar.run({ id: v.id, at, note: v.nota }); anotar.run({ id: v.id, note: v.nota }) } // prettier-ignore
    conteo[v.desenlace] += 1
  }
  const exentas = datos.veredictos
    .filter((v) => v.desenlace !== 'sin_decidir' && v.tipo === 'otro')
    .map((v) => v.id)
  const violaciones = redDeLaFusion(db, p.id, exentas)
  if (violaciones.length > 0) throw new Error(`la migracion no cuadra:\n${violaciones.map((x) => `  criterio ${x.criterio}: ${x.quien} — ${x.detalle}`).join('\n')}`) // prettier-ignore
})
pasoB()
console.log(
  `COMMIT sobre ${base}. ${JSON.stringify(conteo)} · vivas de ${proyecto}: ${antes} -> ${vivas()}`
)
db.close()
