import type { Fuente, Llamada } from './modelo-barrera-fixture'
import { sinComentarios } from './modelo-barrera-fixture'

/** Las UNICAS invocaciones sin modelo permitidas: no son de agente. Exactas. */
export const EXENTAS: readonly string[] = ["['--version']", "['auth', 'status']", "['auth', 'login', '--claudeai']"] // prettier-ignore
const CLAUDE = new Set(['CLAUDE_BIN', 'claudeBin', "'claude'", '"claude"'])
const OTROS = new Set(["'git'", "'npm'", "'which'", 'bwrap', 'GRAPH_BIN', 'caja.value.bin', 'l.bin', 'l.value.bin']) // prettier-ignore
// El rol ya no cierra el parentesis: desde el 137 viaja `trusted` detras.
const DECLARANTE = /\bargsDeLectura\([^)]*'(?:analista|critico|omega)'|\bargsDelGenerador\(|\bargsDelTurno\(|\bargsDeIndexar\(|\bverifyArgs\(/ // prettier-ignore
const NOMBRA_CLAUDE = /\b(?:CLAUDE_BIN|claudeBin)\b|['"]claude['"]/

export type Clase = 'exenta' | 'claude' | 'otro' | 'desconocida'

/** Que binario lanza una llamada, por su forma EXACTA. `bin` a secas es claude
 *  si el fichero nombra al CLI (el analista) y el del grafo si no (reindex).
 *  `caja.value.bin` solo cuenta como «otro» en ficheros que no nombran al CLI. */
export function clasificar(l: Llamada, f: Fuente): Clase {
  if (EXENTAS.includes(l.args)) return 'exenta'
  const nombra = NOMBRA_CLAUDE.test(f.fuente)
  if (CLAUDE.has(l.bin) || (l.bin === 'bin' && nombra)) return 'claude'
  if (OTROS.has(l.bin) && !(l.bin.includes('.bin') && nombra)) return 'otro'
  return l.bin === 'bin' ? 'otro' : 'desconocida'
}

/** Si los args de UNA llamada salen de un declarante: se sigue la variable
 *  (`[...args.value.args]` → `const args = argsDelTurno(...)`), hasta 4 saltos. */
export function declara(l: Llamada, f: Fuente): boolean {
  const t = sinComentarios(f.fuente)
  let frente = [...l.args.matchAll(/\b([A-Za-z_]\w*)\b/g)].map((m) => m[1])
  for (let salto = 0; salto < 4; salto += 1) {
    const exprs = frente.flatMap((v) => [...t.matchAll(new RegExp(`\\bconst ${v}\\s*=\\s*([^\\n]+)`, 'g'))].map((m) => m[1])) // prettier-ignore
    if (DECLARANTE.test(l.args) || exprs.some((e) => DECLARANTE.test(e))) return true
    frente = exprs.flatMap((e) => [...e.matchAll(/\b([A-Za-z_]\w*)\b/g)].map((m) => m[1]))
  }
  return false
}

/** Alias en TODAS las puertas: ningun id completo, y todo `--model` literal es un alias. */
export function modelosFijos(f: Fuente): readonly string[] {
  const t = sinComentarios(f.fuente)
  const ids = [...t.matchAll(/['"`](claude-(?:opus|sonnet|haiku|fable)-\d[\w-]*)['"`]/g)].map((m) => m[1])
  const noAlias = [...t.matchAll(/'--model',\s*'([^']+)'/g)].map((m) => m[1]).filter((m) => !['opus', 'sonnet', 'haiku'].includes(m)) // prettier-ignore
  return [...ids, ...noAlias]
}
