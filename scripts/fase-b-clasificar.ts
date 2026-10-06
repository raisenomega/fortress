import Database from 'better-sqlite3'
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { gemelaDe } from '../src/domain/project/gemela-de-la-zombi.ts'
import { reclasificar } from '../src/domain/project/reclasificacion-de-zombis.ts'
import { promptDeReclasificacion } from '../src/domain/scan/prompt-de-reclasificacion.ts'
import { leerVivasDeHoy, leerZombis } from '../src/infrastructure/persistence/filas-con-identidad-vieja.ts' // prettier-ignore
import { preguntarAlAgente, topeDelAgente } from './fase-b-agente.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'
import { planImpreso } from './fase-b-plan.ts'

// Pieza 2a: clasifica las zombis CON GEMELA (paso A) y deja el resultado y el
// plan en internal/, por proyecto, para que la operadora los revise. NO escribe
// en la base: la abre en solo lectura. Quien reclasifica de verdad es la 2b.
// Uso: npm run fase-b:clasificar -- <proyecto> [--base <ruta>]
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
const RUTA = base ?? join(homedir(), '.config/fortress-command-center/fortress.db')
const db = new Database(RUTA, { readonly: true })
const p = db.prepare('SELECT id, path FROM projects WHERE name = ?').get(proyecto) as { id: string; path: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${RUTA}`)

const zombis = leerZombis(db, p.id)
const vivas = leerVivasDeHoy(db, p.id)
const conCandidata = zombis.map((z) => ({ ...z, candidata: gemelaDe(z, vivas) }))
const enAlcance = conCandidata.filter((z) => z.candidata !== null)
const fueraDeAlcance = conCandidata.filter((z) => z.candidata === null).map((z) => z.id)
console.log(`${zombis.length} zombis en ${proyecto}: ${enAlcance.length} con gemela (paso A), ${fueraDeAlcance.length} sin gemela (paso B, no se tocan). Base: ${RUTA}`) // prettier-ignore
const tope = topeDelAgente(db)
db.close()

const items = enAlcance.map((z) => ({
  id: z.id, file: z.file, line: z.line, title: z.title, severity: z.severity,
  candidata: z.candidata === null ? null : { id: z.candidata.id, line: z.candidata.line, tipo: z.candidata.tipo, title: vivas.find((v) => v.id === z.candidata?.id)?.title ?? '' }
})) // prettier-ignore
console.log(
  `Preguntando al agente por ${items.length} hallazgos, dentro de la caja, sobre ${p.path} ...`
)
const respuesta = preguntarAlAgente(promptDeReclasificacion(items), p.path, tope)
const decididas = reclasificar(
  enAlcance,
  (respuesta.crudo.clasificados ?? []) as Parameters<typeof reclasificar>[1]
)

const filas = decididas.map((d) => {
  const z = enAlcance.find((x) => x.id === d.id)
  if (z === undefined) throw new Error(`reclasificada sin zombi: ${d.id}`)
  return { ...d, file: z.file, line: z.line, title_viejo: z.title, severity: z.severity, identidad_vieja: z.identity, first_seen: z.first_seen } // prettier-ignore
})
const SALIDA = join(process.cwd(), 'internal', `fase-b-clasificacion-${proyecto}.json`)
const PLAN = join(process.cwd(), 'internal', `fase-b-plan-${proyecto}.txt`)
writeFileSync(SALIDA, JSON.stringify({ proyecto, base: RUTA, coste: respuesta.coste, clasificadas: filas, fueraDeAlcance }, null, 2)) // prettier-ignore
const plan = planImpreso(proyecto, filas, fueraDeAlcance.length)
writeFileSync(PLAN, `${plan.join('\n')}\n`)
console.log(plan.join('\n'))
console.log(`\ncoste real: $${respuesta.coste.toFixed(4)}\nJSON: ${SALIDA}\nPLAN: ${PLAN}`)
