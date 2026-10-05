import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ES_TEST = /\.test\.ts$|fixture|fake/
export interface Fuente { readonly ruta: string; readonly fuente: string }

/** Todos los .ts de `src/` que no son tests: la barrera cubre lo que LANZA LA
 *  APP. `scripts/` queda fuera por diseno (ADR-078, enmienda: herramientas del
 *  operador, se corren a mano, heredan por decision consciente). */
export function fuentes(dir = 'src'): readonly Fuente[] {
  return readdirSync(dir).flatMap((e) => {
    const ruta = join(dir, e)
    if (statSync(ruta).isDirectory()) return fuentes(ruta)
    return ruta.endsWith('.ts') && !ES_TEST.test(ruta) ? [{ ruta, fuente: readFileSync(ruta, 'utf8') }] : [] // prettier-ignore
  })
}

/** Quien lanza un `claude`: importa child_process, spawnea, y su binario es el
 *  del CLI (no el del grafo, no git). */
export const lanzanClaude = (fs: readonly Fuente[]): readonly Fuente[] =>
  fs.filter(({ fuente }) => /from '(?:node:)?child_process'/.test(fuente) && /\b(?:spawn|spawnSync|execFile)\(/.test(fuente) && /\b(?:CLAUDE_BIN|claudeBin)\b/.test(fuente)) // prettier-ignore

/** Los constructores de argumentos que DECLARAN modelo (o se niegan sin el), y
 *  las invocaciones que no son de agente. Lo que lance sin uno de estos, hereda. */
export const DECLARANTES = /\bargsDeLectura\([^)]*'(?:analista|critico|omega)'\)|\bargsDelGenerador\(|\bargsDelTurno\(|\bargsDeIndexar\(|\bverifyArgs\(|\['auth',|\['--version'\]/ // prettier-ignore

/** Peticiones de turno SIN agente (`agentId: null` junto a `permissionMode`):
 *  cada una tiene que llevar `model:` en el mismo objeto. */
export function rutasSinAgente(f: Fuente): ReadonlyArray<{ readonly linea: number; readonly declara: boolean }> { // prettier-ignore
  const ls = f.fuente.split('\n')
  return ls.flatMap((l, i) => {
    if (!/agentId: null/.test(l)) return []
    const ventana = ls.slice(Math.max(0, i - 6), i + 7).join('\n')
    return /permissionMode/.test(ventana) ? [{ linea: i + 1, declara: /\bmodel:/.test(ventana) }] : []
  })
}

/** La otra puerta: quien construye un cliente del SDK (`new Anthropic(`). */
export const usanElSdk = (fs: readonly Fuente[]): readonly Fuente[] => fs.filter(({ fuente }) => /new Anthropic\(/.test(fuente))

/** El codigo sin comentarios: un id CITADO en una nota historica no es un id en uso. */
export const sinComentarios = (t: string): string => t.replace(/(^|\s)(?:\/\*[\s\S]*?\*\/|\/\/.*$)/gm, '$1')
