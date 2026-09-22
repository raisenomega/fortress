import Database from 'better-sqlite3'
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { veredictosDelLote } from '../src/domain/project/veredictos-del-lote.ts'
import { promptDeVerificacionPorLote } from '../src/domain/scan/prompt-de-verificacion-por-lote.ts'
import { createFsProbe } from '../src/infrastructure/omega/fs-probe.ts'
import { zombisSinGemela } from '../src/infrastructure/persistence/zombis-sin-gemela.ts'
import { preguntarAlAgente } from './fase-b-agente.ts'
import { leerArgumentos } from './fase-b-argumentos.ts'
import { planDelPasoB } from './fase-b-paso-b-plan.ts'

// Paso B, 2a: el juicio por LOTE de las zombis sin gemela. Una llamada al
// agente en la caja; FORTRESS comprueba cada evidencia en el fichero de hoy y
// deja el veredicto y el plan en internal/, por proyecto. NO escribe en la
// base: la abre en solo lectura. Uso: npm run fase-b:juzgar -- <proyecto> [--base <ruta>]
const { proyecto, base } = leerArgumentos(process.argv.slice(2))
const RUTA = base ?? join(homedir(), '.config/fortress-command-center/fortress.db')
const db = new Database(RUTA, { readonly: true })
const p = db.prepare('SELECT id, path FROM projects WHERE name = ?').get(proyecto) as { id: string; path: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${RUTA}`)
const zombis = zombisSinGemela(db, p.id)
db.close()
console.log(`${zombis.length} zombis sin gemela en ${proyecto}. Base: ${RUTA}. Preguntando al agente, dentro de la caja, sobre ${p.path} ...`) // prettier-ignore

const items = zombis.map((z) => ({
  id: z.id,
  file: z.file,
  line: z.line,
  title: z.title,
  severity: z.severity
}))
const respuesta = preguntarAlAgente(promptDeVerificacionPorLote(items), p.path)
const contenidoDe = (file: string): string | null => createFsProbe().contenido(p.path, file)
const veredictos = veredictosDelLote(zombis, (respuesta.crudo.juzgados ?? []) as Parameters<typeof veredictosDelLote>[1], contenidoDe) // prettier-ignore

const filas = veredictos.map((v) => {
  const z = zombis.find((x) => x.id === v.id)
  if (z === undefined) throw new Error(`veredicto sin zombi: ${v.id}`)
  return { ...v, file: z.file, line: z.line, title_viejo: z.title, severity: z.severity, identidad_vieja: z.identity } // prettier-ignore
})
const SALIDA = join(process.cwd(), 'internal', `fase-b-paso-b-${proyecto}.json`)
const PLAN = join(process.cwd(), 'internal', `fase-b-paso-b-plan-${proyecto}.txt`)
writeFileSync(
  SALIDA,
  JSON.stringify({ proyecto, base: RUTA, coste: respuesta.coste, veredictos: filas }, null, 2)
)
const plan = planDelPasoB(proyecto, filas)
writeFileSync(PLAN, `${plan.join('\n')}\n`)
console.log(plan.join('\n'))
console.log(`\ncoste real: $${respuesta.coste.toFixed(4)}\nJSON: ${SALIDA}\nPLAN: ${PLAN}`)
