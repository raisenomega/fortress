import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AUTONOMY_RULES_FILES } from './auto-merge-blacklist'

/** Todo fichero fuente de `src`, sin tests ni dobles: lo que el barrido juzga. */
export const ficheros = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((e) => {
    const ruta = join(dir, e)
    if (statSync(ruta).isDirectory()) return ficheros(ruta)
    return ruta.endsWith('.ts') && !/\.test\.ts$|fixture|fake/.test(ruta) ? [ruta] : []
  })

/** Un fichero esta cubierto por su ruta exacta o por un glob de carpeta. */
export const cubierto = (f: string): boolean =>
  AUTONOMY_RULES_FILES.some((p) => p === f || (p.endsWith('/**') && f.startsWith(p.slice(0, -2))))

export const fuente = (f: string): string => readFileSync(f, 'utf8')

/** Se juzga codigo, no comentarios: un docblock que nombre la guarda no cuenta. */
export const codigo = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
export const todos = ficheros('src')
