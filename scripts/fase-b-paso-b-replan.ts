import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { zombisSinGemela } from '../src/infrastructure/persistence/zombis-sin-gemela.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'
import { emitirPlan, type Salida } from './fase-b-paso-b-emitir.ts'

// Paso B, 2a bis: vuelve a emitir el plan desde el JSON revisado, SIN llamar al
// agente. Sirve cuando Jojo corrige un veredicto a mano —el plan impreso tiene
// que salir del JSON que se va a aplicar— y cuando el JSON es anterior a las
// fusiones: el juicio del 2026-09-22 costo $3,71 y no se repite por un campo.
// Uso: npm run fase-b:replan -- <proyecto> [--base <ruta>]
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
const RUTA = base ?? join(homedir(), '.config/fortress-command-center/fortress.db')
const db = new Database(RUTA, { readonly: true })
const p = db.prepare('SELECT id FROM projects WHERE name = ?').get(proyecto) as { id: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${RUTA}`)
const salida = JSON.parse(readFileSync(join(process.cwd(), 'internal', `fase-b-paso-b-${proyecto}.json`), 'utf8')) as Salida // prettier-ignore
if (salida.proyecto !== proyecto)
  throw new Error(`el JSON es de ${salida.proyecto}, no de ${proyecto}`)
const zombis = zombisSinGemela(db, p.id)
const ids = new Set(zombis.map((z) => z.id))
if (zombis.length !== salida.veredictos.length || salida.veredictos.some((v) => !ids.has(v.id))) throw new Error(`fail-closed: la base no cuadra con el JSON (${zombis.length} zombis, ${salida.veredictos.length} veredictos)`) // prettier-ignore
emitirPlan(db, p.id, zombis, { ...salida, base: RUTA })
db.close()
