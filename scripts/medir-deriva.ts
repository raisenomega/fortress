import Database from 'better-sqlite3'
import { spawnSync } from 'child_process'
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import type { Project } from '../src/domain/project/project.ts'
import { ejecutaConConfianza } from '../src/domain/repair/confianza.ts'
import {
  registradasDeLaParada,
  type FilaRegistrada
} from '../src/domain/scan/memoria-de-la-parada.ts'
import { parseScanOutput } from '../src/domain/scan/parse-scan-output.ts'
import { buildScanPrompt } from '../src/domain/scan/scan-prompt.ts'
import { termometroDeOtro } from '../src/domain/scan/termometro-de-otro.ts'
import { buildEnv } from '../src/infrastructure/claude-code/build-env.ts'
import { discoverCorpus } from '../src/infrastructure/project/discover-corpus.ts'
import { conSandbox } from '../src/infrastructure/sandbox/con-sandbox.ts'
import { cruzar, reencontradas } from './medir-deriva-cruce.ts'

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
const p = db.prepare('SELECT id, path, trusted FROM projects WHERE name = ?').get(proyecto) as { id: string; path: string; trusted: number } | undefined // prettier-ignore
if (p === undefined) throw new Error(`No hay ningun proyecto llamado "${proyecto}" en ${base}`)
// Gate de confianza (gate-guards): la parada corre `claude` con Bash pre-aprobado
// y cwd en el arbol del proyecto; sin confianza eso es ejecutar codigo ajeno con
// el usuario del operador, y la caja no basta — el codigo sigue viendo el disco.
if (!ejecutaConConfianza({ ...p, trusted: p.trusted === 1 } as Project))
  throw new Error(`"${proyecto}" no es de confianza: conmuta el TrustToggle antes de medir`)
const vivas = db.prepare(`SELECT file, line, identity, simbolo, lifecycle, tipo FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`).all(p.id) as (FilaRegistrada & { tipo: string })[] // prettier-ignore
db.close()
const registradas = sinMemoria ? [] : registradasDeLaParada(vivas, [carpeta])
const prompt = buildScanPrompt(proyecto, discoverCorpus(p.path), [carpeta], undefined, registradas)
console.log(`${proyecto} · carpeta ${carpeta} · ${sinMemoria ? 'SIN memoria (control)' : `CON memoria: ${registradas.length} registradas`} · lanzando la parada en la caja ...`) // prettier-ignore

const args = conSandbox(['-p', prompt, '--output-format', 'json', '--permission-mode', 'default', '--allowedTools', 'Bash,Read,Grep,Glob'], p.path) // prettier-ignore
if (!args.ok) throw new Error(`sin caja: ${args.error}`)
const salida = spawnSync('claude', [...args.value], { cwd: p.path, env: buildEnv(null), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) // prettier-ignore
if (salida.status !== 0)
  throw new Error(`el escaner salio con ${salida.status}: ${salida.stderr.slice(0, 300)}`)
const res = JSON.parse(salida.stdout) as { result?: string; total_cost_usd?: number }
const parsed = parseScanOutput(res.result ?? '')
if (!parsed.ok) throw new Error(`informe ilegible: ${parsed.error}`)

const enCarpeta = vivas.filter((v) => v.file === carpeta || v.file.startsWith(`${carpeta}/`))
const cruce = cruzar(enCarpeta, parsed.value.map((f) => ({ file: f.file, line: f.line, tipo: f.tipo, title: f.title }))) // prettier-ignore
const n = (v: string): number => cruce.filter((c) => c.veredicto === v).length
const termometro = termometroDeOtro(parsed.value)
const resumen = { proyecto, carpeta, memoria: !sinMemoria, registradas: registradas.length, enCarpeta: enCarpeta.length, emitidos: cruce.length, conservados: n('conservado'), sustituciones: n('sustitucion'), facetasExtra: n('faceta-extra'), nuevos: n('nuevo'), reencontradas: reencontradas(enCarpeta, cruce), otro: termometro === null ? 0 : termometro.otros, coste: res.total_cost_usd ?? 0 } // prettier-ignore
const SALIDA = join(process.cwd(), 'internal', `deriva-${proyecto}-${carpeta.replace(/\//g, '_')}-${sinMemoria ? 'sin' : 'con'}-memoria.json`) // prettier-ignore
writeFileSync(SALIDA, JSON.stringify({ ...resumen, cruce }, null, 2))
console.log(JSON.stringify(resumen))
for (const c of cruce.filter((x) => x.veredicto !== 'conservado' && x.veredicto !== 'nuevo')) console.log(`  ${c.veredicto.toUpperCase()} ${c.file}:${c.line} registrados=[${c.registrados.join(',')}] emitido=${c.tipo} | ${c.title.slice(0, 70)}`) // prettier-ignore
console.log(`JSON: ${SALIDA}`)
