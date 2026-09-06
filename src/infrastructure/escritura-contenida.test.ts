import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Nadie ESCRIBE en el repo auditado sobre una ruta compuesta a mano.
 *
 * `join(projectPath, nombre)` es un filtro lexico y un enlace simbolico no lo
 * es: si ese nombre resulta ser un enlace, `writeFileSync` escribe en el
 * destino, fuera de la raiz. En un repositorio ajeno —lo que esta app audita—
 * ese enlace lo commitea cualquiera.
 *
 * El escaner nombro tres sitios. Al barrer aparecieron SIETE, y la defensa ya
 * estaba escrita —entera, con su argumento— en `docs-reader`, aplicada en un
 * solo fichero. Es la octava vez que un control existe en un sitio y falta en
 * los demas, asi que esta vez la regla se deriva.
 *
 * Se mira el OLOR exacto —componer con `join` desde la raiz auditada en un
 * fichero que escribe— y no "escribe y menciona projectPath", que marcaba tres
 * inocentes: los que escriben en NUESTROS temporales y solo pasan la ruta del
 * proyecto a otro. Una regla que grita de mas se acaba desactivando.
 */
const RAIZ = 'src/infrastructure'
const ESCRIBE = /\b(?:writeFileSync|copyFileSync|appendFileSync|mkdirSync)\s*\(/
const COMPONE = /\bjoin\(\s*(?:projectPath|worktreePath|project\.path|scan\.projectPath|repoPath)\b/

const ficheros = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((entrada) => {
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) return ficheros(ruta)
    return ruta.endsWith('.ts') && !/\.test\.ts$|fixture|fake/.test(ruta) ? [ruta] : []
  })

const fuentes = ficheros(RAIZ).map((ruta) => ({ ruta, texto: readFileSync(ruta, 'utf8') }))
const ofensores = fuentes.filter((f) => ESCRIBE.test(f.texto) && COMPONE.test(f.texto))

describe('ninguna escritura en el repo auditado compone la ruta a mano', () => {
  it('el barrido ve la carpeta: si no, esta prueba no probaria nada', () => {
    expect(fuentes.length).toBeGreaterThan(100)
    expect(fuentes.some((f) => f.texto.includes('rutaContenida('))).toBe(true)
  })

  it('no hay ninguno', () => {
    // Si esto falla, la respuesta es pasar esa ruta por `rutaContenida`, que
    // resuelve las dos puntas y comprueba contencion. No relajar la regla.
    expect(ofensores.map((f) => f.ruta)).toEqual([])
  })

  it('y los que escriben ahi usan el control', () => {
    const guardados = fuentes.filter((f) => f.texto.includes('rutaContenida('))

    expect(guardados.length).toBeGreaterThanOrEqual(6)
  })
})
