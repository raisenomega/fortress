import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

export interface Fuente { readonly ruta: string; readonly fuente: string }
export interface Llamada { readonly ruta: string; readonly linea: number; readonly bin: string; readonly args: string }

/** TODO `src/` salvo los `*.test.ts` (por sufijo EXACTO: un `fake`/`fixture` en
 *  la ruta ya no esconde nada). La barrera cubre lo que lanza la app; `scripts/`
 *  queda fuera por diseno (ADR-078, enmienda). Sin `head` ni limite: un censo
 *  truncado no es un censo (la leccion del PASO 0). */
export function fuentes(dir = 'src'): readonly Fuente[] {
  return readdirSync(dir).flatMap((e) => {
    const ruta = join(dir, e)
    if (statSync(ruta).isDirectory()) return fuentes(ruta)
    return ruta.endsWith('.ts') && !ruta.endsWith('.test.ts') ? [{ ruta, fuente: readFileSync(ruta, 'utf8') }] : [] // prettier-ignore
  })
}

/** El codigo sin comentarios (un id CITADO en una nota no es un id en uso),
 *  conservando los saltos de linea: el fichero:linea que se reporta es exacto. */
export const sinComentarios = (t: string): string => t.replace(/(^|\s)(\/\*[\s\S]*?\*\/|\/\/.*$)/gm, (_, pre: string, c: string) => pre + c.replace(/[^\n]/g, '')) // prettier-ignore

/** Los dos primeros argumentos de una llamada que empieza en `desde`, cortando
 *  por comas de PRIMER nivel (los corchetes y parentesis anidados no cortan). */
function argumentos(t: string, desde: number): readonly string[] {
  const partes: string[] = []
  let nivel = 0
  let actual = ''
  for (let i = desde; i < t.length; i += 1) {
    const c = t[i]
    if ('([{'.includes(c)) nivel += 1
    if (')]}'.includes(c)) nivel -= 1
    if (nivel < 0 || (nivel === 0 && c === ',')) {
      partes.push(actual.trim().replace(/\s+/g, ' '))
      if (nivel < 0 || partes.length === 2) return partes
      actual = ''
    } else actual += c
  }
  return partes
}

/** CADA lanzamiento de proceso (no `re.exec(`: el punto delante lo descarta). */
export function llamadas(f: Fuente): readonly Llamada[] {
  if (!/from '(?:node:)?child_process'/.test(f.fuente)) return []
  const t = sinComentarios(f.fuente)
  const re = /(?<![.\w])(?:spawn|spawnSync|execFile|execFileSync|fork)\(/g
  return [...t.matchAll(re)].map((m) => {
    const [bin = '', args = ''] = argumentos(t, (m.index ?? 0) + m[0].length)
    return { ruta: f.ruta, linea: t.slice(0, m.index).split('\n').length, bin, args }
  })
}

/** Turnos sin agente: `agentId: null` junto a `permissionMode` → `model:` en el objeto. */
export function rutasSinAgente(f: Fuente): ReadonlyArray<{ readonly linea: number; readonly declara: boolean }> { // prettier-ignore
  const ls = f.fuente.split('\n')
  return ls.flatMap((l, i) => {
    if (!/agentId: null/.test(l)) return []
    const ventana = ls.slice(Math.max(0, i - 6), i + 7).join('\n')
    return /permissionMode/.test(ventana) ? [{ linea: i + 1, declara: /\bmodel:/.test(ventana) }] : []
  })
}
