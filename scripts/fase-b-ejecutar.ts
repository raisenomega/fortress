import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { identidadFusionada, planDeFusion } from '../src/domain/project/fusion-de-duplicados.ts'
import { severidadDeLaSuperviviente } from '../src/domain/project/severidad-al-fundir.ts'
import { masUrgente, type Severity } from '../src/domain/shared/severity.ts'
import { leerVivasDeHoy } from '../src/infrastructure/persistence/filas-con-identidad-vieja.ts'
import { MARCAR_FUSIONADA, RECLASIFICAR_FINDING } from '../src/infrastructure/persistence/finding-fusion-sql.ts' // prettier-ignore
import { ELEVAR_SEVERIDAD } from '../src/infrastructure/persistence/reparar-gravedad.ts'
import { appCerrada } from './app-cerrada.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'
import type { FilaDelPlan } from './fase-b-plan.ts'
import { verificarEnCaliente } from './fase-b-verificar.ts'

// Pieza 2b: reclasifica las filas del JSON revisado y funde lo que empate, en
// UNA transaccion con la red de invariantes dentro. NO llama al modelo. Exige
// `--base` explicita (sin defecto a la viva), la app cerrada, y que la base
// cuadre con el JSON: si algo no cuadra, lanza y no queda nada a medias.
// Uso: npm run fase-b:ejecutar -- <proyecto> --base <ruta-de-la-base>
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
if (base === null) throw new Error('fail-closed: --base es obligatoria; ensaya sobre una copia antes de nombrar la viva') // prettier-ignore
if (!appCerrada())
  throw new Error('fail-closed: la app esta abierta; cierrala antes de escribir su base')
interface Datos { readonly proyecto: string; readonly clasificadas: readonly FilaDelPlan[]; readonly fueraDeAlcance: readonly string[] } // prettier-ignore
const datos = JSON.parse(readFileSync(join(process.cwd(), 'internal', `fase-b-clasificacion-${proyecto}.json`), 'utf8')) as Datos // prettier-ignore
if (datos.proyecto !== proyecto)
  throw new Error(`el JSON es de ${datos.proyecto}, no de ${proyecto}`)

const db = new Database(base)
const p = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as
  { id: string } | undefined
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${base}`)
const vivasAntes = (): number =>
  (db.prepare(`SELECT COUNT(*) n FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`).get(p.id) as { n: number }).n // prettier-ignore
const tal = db.prepare(
  `SELECT COUNT(*) n FROM findings WHERE id = ? AND identity = ? AND lifecycle != 'EXTINCT'`
)
const noCuadran = datos.clasificadas.filter(
  (c) => (tal.get(c.id, c.identidad_vieja) as { n: number }).n !== 1
)
if (noCuadran.length > 0) throw new Error(`fail-closed: ${noCuadran.length} filas del JSON no estan en la base tal cual (ya migradas o distintas): ${noCuadran.map((c) => c.id.slice(0, 8)).join(' ')}`) // prettier-ignore

// Exentas del criterio 2: las de paso B, las que el escaner dejo en otro
// legitimamente, y las que el agente no supo clasificar. Fuera de alcance del
// criterio 1: solo las de paso B.
const otroLegitimo = leerVivasDeHoy(db, p.id)
  .filter((v) => v.tipo === 'otro')
  .map((v) => v.id)
const exentas = [...datos.fueraDeAlcance, ...otroLegitimo, ...datos.clasificadas.filter((c) => c.tipo === 'otro').map((c) => c.id)] // prettier-ignore
const antes = vivasAntes()
const reclasificarUna = db.prepare(RECLASIFICAR_FINDING)
const marcar = db.prepare(MARCAR_FUSIONADA)
const elevar = db.prepare(ELEVAR_SEVERIDAD)
const fusiones: string[] = []
const faseB = db.transaction(() => {
  for (const c of datos.clasificadas) reclasificarUna.run({ id: c.id, identity: c.identidad_nueva, tipo: c.tipo, simbolo: c.simbolo }) // prettier-ignore
  const vivas = db.prepare(`SELECT id, identity AS identidad, first_seen AS firstSeen, severity FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`).all(p.id) as { id: string; identidad: string; firstSeen: string; severity: Severity }[] // prettier-ignore
  const porId = new Map(vivas.map((v) => [v.id, v.severity]))
  for (const fusion of planDeFusion(vivas)) {
    fusiones.push(`${fusion.absorbidas.length + 1}->1  ${fusion.identidad}  sobrevive ${fusion.ganadora.slice(0, 8)}, absorbe ${fusion.absorbidas.map((a) => a.slice(0, 8)).join(' ')}`) // prettier-ignore
    for (const id of fusion.absorbidas) marcar.run({ id, motivo: `fusionada-con-${fusion.ganadora}`, identity: identidadFusionada(fusion.ganadora, fusion.identidad) }) // prettier-ignore
    const maxima = severidadDeLaSuperviviente(fusion, porId, masUrgente)
    if (maxima !== porId.get(fusion.ganadora)) elevar.run({ id: fusion.ganadora, severity: maxima })
  }
  verificarEnCaliente(db, p.id, exentas, datos.fueraDeAlcance)
})
faseB()
console.log(
  `COMMIT sobre ${base}. reclasificadas=${datos.clasificadas.length} fusiones=${fusiones.length}`
)
for (const f of fusiones) console.log('  ' + f)
console.log(`vivas: ${antes} -> ${vivasAntes()}`)
db.close()
