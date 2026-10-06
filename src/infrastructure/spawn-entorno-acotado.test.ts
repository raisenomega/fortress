import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { llamadas, sinAcotar, SPAWN } from './spawn-acotado-fixture'

/**
 * Ningun proceso hijo hereda la sesion viva del operador — y la lista de quien
 * spawnea se DERIVA, no se escribe.
 *
 * La primera version enumeraba ocho ficheros a mano. Se dejo dos fuera
 * (`git-commit`, `repair-git`) y los encontro el escaner, no el test; al
 * derivarla aparecieron otros tres mas (`git-init`, `file-history`,
 * `git-push`). Enumerar a mano lo que se puede derivar fue el error, y es el
 * mismo que ya se corrigio en las allowlists del grafo: una lista copiada se
 * queda corta y nadie se entera, porque "el test pasa".
 *
 * La regla mira `cwd`, que es lo que separa las dos clases: un spawn con `cwd`
 * corre DONDE VIVE el repo auditado —sus hooks, sus scripts— y no puede llevar
 * la sesion del operador. Uno sin `cwd` corre nuestras propias herramientas
 * (`claude --version`, `claude auth status`) y no es la amenaza: acotarlo de
 * mas romperia el login, que necesita esa sesion a proposito.
 */
const RAIZ = 'src'
const tiene = (t: string): boolean => new RegExp(SPAWN.source).test(t)
const ES_TEST = /\.test\.ts$|fixture|fake/
const sinComentarios = (t: string): string => t.replace(/(^|\s)(?:\/\*[\s\S]*?\*\/|\/\/.*$)/gm, '$1')

function ficheros(dir: string): readonly string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) return ficheros(ruta)
    return ruta.endsWith('.ts') && !ES_TEST.test(ruta) ? [ruta] : []
  })
}

/** Quien spawnea de verdad: importa `child_process`. Sin eso, un `execFile(`
 *  dentro de una cadena de ejemplo contaria como spawn. */
const spawnean = ficheros(RAIZ)
  .map((ruta) => ({ ruta, fuente: readFileSync(ruta, 'utf8') }))
  .filter(({ fuente }) => /from '(?:node:)?child_process'/.test(fuente) && tiene(fuente))

/** Los que corren DONDE VIVE el repo auditado: su entorno es el que importa. */
const conCwd = spawnean.filter(({ fuente }) =>
  llamadas(sinComentarios(fuente)).some((o) => /\bcwd\b/.test(o))
)

describe('ningun spawn en el repo auditado hereda la sesion del operador', () => {
  it('la lista se deriva y NO esta vacia: si el barrido falla, se nota', () => {
    expect(spawnean.length).toBeGreaterThan(10)
    expect(conCwd.length).toBeGreaterThan(5)
  })

  it.each(conCwd.map((s) => s.ruta))('%s acota su entorno', (ruta) => {
    expect({ ruta, sinAcotar: sinAcotar(sinComentarios(readFileSync(ruta, 'utf8'))) }).toEqual({ ruta, sinAcotar: [] }) // prettier-ignore
  })

  it.each(spawnean.map((s) => s.ruta))('%s no reparte `...process.env`', (ruta) => {
    // La forma exacta de la fuga: el entorno entero mas una variable de git.
    expect({ ruta, crudo: /\.\.\.process\.env/.test(readFileSync(ruta, 'utf8')) }).toEqual({ ruta, crudo: false }) // prettier-ignore
  })
})
