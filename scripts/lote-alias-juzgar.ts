import Database from 'better-sqlite3'
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { paresCandidatos, type FilaDelPar } from '../src/domain/project/pares-candidatos.ts'
import { fusionesDelLote, veredictosDePares } from '../src/domain/project/veredictos-de-pares.ts'
import { promptDePares } from '../src/domain/scan/prompt-de-pares.ts'
import { preguntarAlAgente } from './fase-b-agente.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'
import { planDelLote } from './lote-alias-plan.ts'

// Lote de alias (ADR-101 §5), 2a: los pares candidatos de UN proyecto —misma
// sede o misma linea— juzgados por el agente en la caja: MISMO o DISTINTOS. NO
// escribe en la base: la abre en solo lectura y deja JSON y plan en internal/.
// Uso: npm run lote:juzgar -- <proyecto> [--base <ruta>]
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
const RUTA = base ?? join(homedir(), '.config/fortress-command-center/fortress.db')
const db = new Database(RUTA, { readonly: true })
const p = db.prepare('SELECT id, path FROM projects WHERE name = ?').get(proyecto) as { id: string; path: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${RUTA}`)
const VIVAS = `SELECT id, file, line, tipo, simbolo, title, identity, first_seen AS firstSeen, severity FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'` // prettier-ignore
const vivas = db.prepare(VIVAS).all(p.id) as FilaDelPar[]
db.close()
const pares = paresCandidatos(vivas)
if (pares.length === 0) throw new Error(`${proyecto}: ningun par candidato; nada que juzgar`)
console.log(`${pares.length} pares candidatos en ${proyecto} (${vivas.length} vivas). Base: ${RUTA}. Preguntando al agente, dentro de la caja, sobre ${p.path} ...`) // prettier-ignore

const respuesta = preguntarAlAgente(promptDePares(pares), p.path)
const veredictos = veredictosDePares(pares, (respuesta.crudo.pares ?? []) as Parameters<typeof veredictosDePares>[1]) // prettier-ignore
const fusiones = fusionesDelLote(veredictos)
const SALIDA = join(process.cwd(), 'internal', `lote-alias-${proyecto}.json`)
const PLAN = join(process.cwd(), 'internal', `lote-alias-plan-${proyecto}.txt`)
writeFileSync(SALIDA, JSON.stringify({ proyecto, base: RUTA, coste: respuesta.coste, veredictos, fusiones }, null, 2)) // prettier-ignore
const plan = planDelLote(proyecto, veredictos, fusiones)
writeFileSync(PLAN, `${plan.join('\n')}\n`)
console.log(plan.join('\n'))
console.log(`\ncoste real: $${respuesta.coste.toFixed(4)}\nJSON: ${SALIDA}\nPLAN: ${PLAN}`)
