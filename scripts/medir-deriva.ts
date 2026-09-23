import Database from 'better-sqlite3'
import { spawnSync } from 'child_process'
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import {
  registradasDeLaParada,
  type FilaRegistrada
} from '../src/domain/scan/memoria-de-la-parada.ts'
import { parseScanOutput } from '../src/domain/scan/parse-scan-output.ts'
import { buildScanPrompt } from '../src/domain/scan/scan-prompt.ts'
import { termometroDeOtro } from '../src/domain/scan/termometro-de-otro.ts'
import { discoverCorpus } from '../src/infrastructure/project/discover-corpus.ts'
import { conSandbox } from '../src/infrastructure/sandbox/con-sandbox.ts'

// Mide la deriva del tipo de UNA parada de carpeta, con o sin la memoria de
// ADR-101 (palanca 1): lanza el prompt de la parada en la caja, parsea el informe
// y cruza lo emitido con lo ya registrado en la base (solo lectura). NO escribe
// en la base: no hay sync. Sin grafo ni persona de agente: mide la eleccion del
// tipo, no el hallazgo. Uso: npm run medir:deriva -- <proyecto> <carpeta> [--sin-memoria] [--base <ruta>]
const argv = process.argv.slice(2)
const [proyecto, carpeta] = argv
if (!proyecto || !carpeta)
  throw new Error('uso: <proyecto> <carpeta> [--sin-memoria] [--base <ruta>]')
const sinMemoria = argv.includes('--sin-memoria')
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : join(homedir(), '.config/fortress-command-center/fortress.db') // prettier-ignore
const db = new Database(base, { readonly: true })
const p = db.prepare('SELECT id, path FROM projects WHERE name = ?').get(proyecto) as { id: string; path: string } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${base}`)
const vivas = db.prepare(`SELECT file, line, identity, simbolo, lifecycle, tipo FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`).all(p.id) as (FilaRegistrada & { tipo: string })[] // prettier-ignore
db.close()
const registradas = sinMemoria ? [] : registradasDeLaParada(vivas, [carpeta])
const prompt = buildScanPrompt(proyecto, discoverCorpus(p.path), [carpeta], undefined, registradas)
console.log(`${proyecto} · carpeta ${carpeta} · ${sinMemoria ? 'SIN memoria (control)' : `CON memoria: ${registradas.length} registradas`} · lanzando la parada en la caja ...`) // prettier-ignore

const args = conSandbox(['-p', prompt, '--output-format', 'json', '--permission-mode', 'default', '--allowedTools', 'Bash,Read,Grep,Glob'], p.path) // prettier-ignore
if (!args.ok) throw new Error(`sin caja: ${args.error}`)
const salida = spawnSync('claude', [...args.value], { cwd: p.path, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) // prettier-ignore
if (salida.status !== 0)
  throw new Error(`el escaner salio con ${salida.status}: ${salida.stderr.slice(0, 300)}`)
const res = JSON.parse(salida.stdout) as { result?: string; total_cost_usd?: number }
const parsed = parseScanOutput(res.result ?? '')
if (!parsed.ok) throw new Error(`informe ilegible: ${parsed.error}`)

const enCarpeta = vivas.filter((v) => v.file === carpeta || v.file.startsWith(`${carpeta}/`))
const porSitio = new Map(enCarpeta.map((v) => [`${v.file.toLowerCase()}:${v.line ?? '-'}`, v.tipo]))
const cruce = parsed.value.map((f) => {
  const registrado = porSitio.get(`${f.file.toLowerCase()}:${f.line ?? '-'}`)
  const veredicto =
    registrado === undefined ? 'nuevo' : registrado === f.tipo ? 'conservado' : 'DERIVA'
  return {
    file: f.file,
    line: f.line,
    tipo: f.tipo,
    registrado: registrado ?? null,
    veredicto,
    title: f.title
  }
})
const n = (v: string): number => cruce.filter((c) => c.veredicto === v).length
const termometro = termometroDeOtro(parsed.value)
const resumen = { proyecto, carpeta, memoria: !sinMemoria, registradas: registradas.length, emitidos: cruce.length, conservados: n('conservado'), deriva: n('DERIVA'), nuevos: n('nuevo'), otro: termometro === null ? 0 : termometro.otros, coste: res.total_cost_usd ?? 0 } // prettier-ignore
const SALIDA = join(process.cwd(), 'internal', `deriva-${proyecto}-${carpeta.replace(/\//g, '_')}-${sinMemoria ? 'sin' : 'con'}-memoria.json`) // prettier-ignore
writeFileSync(SALIDA, JSON.stringify({ ...resumen, cruce }, null, 2))
console.log(JSON.stringify(resumen))
for (const c of cruce.filter((x) => x.veredicto === 'DERIVA')) console.log(`  DERIVA ${c.file}:${c.line} registrado=${c.registrado} emitido=${c.tipo} | ${c.title.slice(0, 70)}`) // prettier-ignore
console.log(`JSON: ${SALIDA}`)
