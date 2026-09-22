import Database from 'better-sqlite3'
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { fusionesDelRetipado } from '../src/domain/project/fusiones-del-retipado.ts'
import { retipar } from '../src/domain/project/retipado-de-otros.ts'
import { promptDeRetipado } from '../src/domain/scan/prompt-de-retipado.ts'
import { leerVivasDeHoy } from '../src/infrastructure/persistence/filas-con-identidad-vieja.ts'
import { leerOtros } from '../src/infrastructure/persistence/filas-otro.ts'
import { preguntarAlAgente } from './fase-b-agente.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'
import { planDelRetipado, type FilaDelRetipado } from './retipar-plan.ts'

// Re-tipado de ADR-100, 2a: el juicio por LOTE de las vivas en `otro` de UN
// proyecto. Una llamada al agente en la caja del proyecto; FORTRESS deja el
// veredicto y el plan en internal/. NO escribe en la base: la abre en solo
// lectura. Uso: npm run retipar:juzgar -- <proyecto> [--base <ruta>]
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
const RUTA = base ?? join(homedir(), '.config/fortress-command-center/fortress.db')
const db = new Database(RUTA, { readonly: true })
const p = db.prepare('SELECT id, path FROM projects WHERE name = ?').get(proyecto) as { id: string; path: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${RUTA}`)
const otros = leerOtros(db, p.id)
if (otros.length === 0) throw new Error(`${proyecto}: ninguna viva en otro; nada que juzgar`)
console.log(`${otros.length} vivas en otro en ${proyecto}. Base: ${RUTA}. Preguntando al agente, dentro de la caja, sobre ${p.path} ...`) // prettier-ignore

const items = otros.map(({ id, file, line, title, severity }) => ({ id, file, line, title, severity })) // prettier-ignore
const respuesta = preguntarAlAgente(promptDeRetipado(items), p.path)
const retipados = retipar(otros, (respuesta.crudo.retipadas ?? []) as Parameters<typeof retipar>[1]) // prettier-ignore
const vivas = leerVivasDeHoy(db, p.id).map((v) => ({ id: v.id, identidad: v.identity, firstSeen: v.first_seen })) // prettier-ignore
const fusiones = fusionesDelRetipado(vivas, retipados)
db.close()

const filas: FilaDelRetipado[] = retipados.map((r) => {
  const o = otros.find((x) => x.id === r.id)
  if (o === undefined) throw new Error(`veredicto sin fila: ${r.id}`)
  return { ...r, file: o.file, line: o.line, title: o.title, severity: o.severity, identidad_vieja: o.identity } // prettier-ignore
})
const SALIDA = join(process.cwd(), 'internal', `retipado-${proyecto}.json`)
const PLAN = join(process.cwd(), 'internal', `retipado-plan-${proyecto}.txt`)
writeFileSync(SALIDA, JSON.stringify({ proyecto, base: RUTA, coste: respuesta.coste, retipados: filas, fusiones }, null, 2)) // prettier-ignore
const plan = planDelRetipado(proyecto, filas, fusiones)
writeFileSync(PLAN, `${plan.join('\n')}\n`)
console.log(plan.join('\n'))
console.log(`\ncoste real: $${respuesta.coste.toFixed(4)}\nJSON: ${SALIDA}\nPLAN: ${PLAN}`)
