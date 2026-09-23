import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Fusion } from '../src/domain/project/fusion-de-duplicados.ts'
import { paresCandidatos, type FilaDelPar } from '../src/domain/project/pares-candidatos.ts'
import type { VeredictoDePar } from '../src/domain/project/veredictos-de-pares.ts'
import { createFusionPorJuicio } from '../src/infrastructure/persistence/finding-fusion-por-juicio.ts'
import { redDeLaFusion } from '../src/infrastructure/persistence/red-de-la-fusion.ts'
import { ALIASES_SCHEMA } from '../src/infrastructure/persistence/schema-aliases.ts'
import { appCerrada } from './app-cerrada.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'

// Lote de alias, 2b: aplica las fusiones del JSON revisado en UNA transaccion.
// Exige --base explicita y la app cerrada; cada par del JSON tiene que seguir
// siendo candidato en la base y sus filas seguir vivas. Si algo no cuadra, no
// se escribe nada. Uso: npm run lote:aplicar -- <proyecto> --base <ruta>
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
if (base === null) throw new Error('fail-closed: --base es obligatoria; ensaya sobre una copia antes de nombrar la viva') // prettier-ignore
if (!appCerrada())
  throw new Error('fail-closed: la app esta abierta; cierrala antes de escribir su base')
interface Datos { readonly proyecto: string; readonly veredictos: readonly VeredictoDePar[]; readonly fusiones: readonly Fusion[] } // prettier-ignore
const datos = JSON.parse(readFileSync(join(process.cwd(), 'internal', `lote-alias-${proyecto}.json`), 'utf8')) as Datos // prettier-ignore
if (datos.proyecto !== proyecto)
  throw new Error(`el JSON es de ${datos.proyecto}, no de ${proyecto}`)

const db = new Database(base)
// La tabla de alias la crea la app al abrir; una base que la app aun no abrio
// con este codigo no la tiene, y el esquema es aditivo e idempotente.
db.exec(ALIASES_SCHEMA)
const p = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as { id: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${base}`)
const VIVAS = `SELECT id, file, line, tipo, simbolo, title, identity, first_seen AS firstSeen, severity FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'` // prettier-ignore
const vivas = db.prepare(VIVAS).all(p.id) as FilaDelPar[]
const hoy = new Set(paresCandidatos(vivas).map((x) => x.id))
const ausentes = datos.veredictos.filter((v) => !hoy.has(v.par))
if (ausentes.length > 0) throw new Error(`fail-closed: ${ausentes.length} pares del JSON ya no son candidatos en la base (${ausentes.map((v) => v.par.slice(0, 8)).join(' ')})`) // prettier-ignore
const vivos = new Set(vivas.map((v) => v.id))
for (const f of datos.fusiones) for (const id of [f.ganadora, ...f.absorbidas]) if (!vivos.has(id)) throw new Error(`fail-closed: la fila ${id.slice(0, 8)} de una fusion ya no esta viva`) // prettier-ignore

const cuenta = (sql: string): number => (db.prepare(sql).get(p.id) as { n: number }).n
const N_VIVAS = `SELECT COUNT(*) n FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`
const N_ALIAS = `SELECT COUNT(*) n FROM finding_aliases WHERE project_id = ?`
const antes = { vivas: cuenta(N_VIVAS), alias: cuenta(N_ALIAS) }
const exentas = vivas.filter((v) => v.tipo === 'otro').map((v) => v.id)
const fundir = createFusionPorJuicio(db)
const lote = db.transaction((): number => {
  let absorbidas = 0
  for (const f of datos.fusiones) absorbidas += fundir.fundir(p.id, f)
  const violaciones = redDeLaFusion(db, p.id, exentas)
  if (violaciones.length > 0) throw new Error(`la migracion no cuadra:\n${violaciones.map((x) => `  criterio ${x.criterio}: ${x.quien} — ${x.detalle}`).join('\n')}`) // prettier-ignore
  return absorbidas
})
const absorbidas = lote()
console.log(`COMMIT sobre ${base}. fusiones=${datos.fusiones.length} absorbidas=${absorbidas} · vivas de ${proyecto}: ${antes.vivas} -> ${cuenta(N_VIVAS)} · alias: ${antes.alias} -> ${cuenta(N_ALIAS)}`) // prettier-ignore
db.close()
