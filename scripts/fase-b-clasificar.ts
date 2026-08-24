import Database from 'better-sqlite3'
import { spawnSync } from 'child_process'
import { writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { findingIdentity } from '../src/domain/project/finding-identity.ts'
import { aTipoDeDefecto } from '../src/domain/scan/tipo-de-defecto.ts'
import { PREDICCION, promptDeClasificacion, type ItemAClasificar } from './fase-b-prompt.ts'
import { agrupar, leerVivas, type Clasificado, type Fila } from './fase-b-lectura.ts'

// Pieza 2a: clasifica las filas VIVAS con identidad vieja y deja el resultado en
// un JSON para que el operador lo revise. NO escribe en la base: la abre en modo
// solo lectura, y quien reclasifica de verdad es la 2b, en su transaccion unica.
const RAIZ = process.cwd()
const SALIDA = join(RAIZ, 'internal', 'fase-b-clasificacion.json')

const db = new Database(join(homedir(), '.config/fortress-command-center/fortress.db'), { readonly: true }) // prettier-ignore
const filas = leerVivas(db, 'fortress-command-center')
console.log(`LA PREDICCION, antes de mirar nada:\n${PREDICCION.map((p) => '  ' + p).join('\n')}\n`)
console.log(`${filas.length} filas vivas con identidad vieja. Llamando al clasificador...`)

const items: ItemAClasificar[] = filas.map(({ id, file, line, title, severity }) => ({ id, file, line, title, severity })) // prettier-ignore
const args = ['-p', promptDeClasificacion(RAIZ, items), '--output-format', 'stream-json', '--verbose', '--permission-mode', 'plan'] // prettier-ignore
// prettier-ignore
const salida = spawnSync('claude', args, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
if (salida.status !== 0) throw new Error(`el clasificador salio con ${salida.status}`)

let texto = ''
let coste = 0
for (const linea of salida.stdout.split('\n')) {
  if (linea.trim() === '') continue
  const evento = JSON.parse(linea) as { type?: string; result?: string; total_cost_usd?: number }
  if (evento.type !== 'result') continue
  texto = evento.result ?? ''
  coste = evento.total_cost_usd ?? 0
}

const bloque = /```json\s*([\s\S]*?)```/g
const bloques = [...texto.matchAll(bloque)]
if (bloques.length === 0) throw new Error('el clasificador no devolvio bloque json')
const crudo = JSON.parse(bloques[bloques.length - 1][1]) as { clasificados?: Clasificado[] }
const porId = new Map((crudo.clasificados ?? []).map((c) => [c.id, c]))

const clasificadas = filas.map((fila: Fila) => {
  const c = porId.get(fila.id)
  const tipo = aTipoDeDefecto(c?.tipo)
  const simbolo = typeof c?.simbolo === 'string' ? c.simbolo.trim() : ''
  return {
    id: fila.id, file: fila.file, title_viejo: fila.title, severity: fila.severity,
    tipo, simbolo, identidad_vieja: fila.identity, first_seen: fila.first_seen,
    identidad_nueva: findingIdentity({ ...fila, tipo, simbolo })
  } // prettier-ignore
})

const grupos = agrupar(clasificadas)
writeFileSync(SALIDA, JSON.stringify({ prediccion: PREDICCION, coste, clasificadas, grupos }, null, 2)) // prettier-ignore
console.log(`\ncoste real: $${coste.toFixed(4)}`)
console.log(`sin clasificar (cayeron a 'otro'): ${clasificadas.filter((c) => c.tipo === 'otro').length}`) // prettier-ignore
console.log(`\nGRUPOS QUE FUSIONARIAN (identidad nueva repetida):`)
for (const g of grupos) console.log(`  ${g.ids.length}->1  ${g.identidad}`)
console.log(`\nJSON: ${SALIDA}`)
