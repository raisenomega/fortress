import { describe, expect, it } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { matchesGlob } from '../shared/path-glob'
import { AUTONOMY_RULES_FILES, COMMON_SENSITIVE_AREAS } from './auto-merge-blacklist'

/**
 * Ningun patron de la lista innegociable puede estar MUERTO.
 *
 * Un glob que no encaja con nada no protege, pero lo parece: figura en la lista,
 * se lee como una defensa y no frena nada. Es peor que no tenerlo, porque quien
 * repase la lista lo cuenta como cubierto y deja de mirar.
 *
 * Paso de verdad. `electron/**` llevaba desde el 14 de agosto en la
 * configuracion del proyecto, puesto para proteger la capa de la ventana, y
 * nunca matcheo: los patrones se anclan en la RAIZ del repo y ese codigo vive en
 * `src/infrastructure/electron/`. El aislamiento del renderer —`sandbox`,
 * `contextIsolation`, `nodeIntegration: false`— estuvo tres semanas al alcance
 * de una integracion automatica de una linea, cubierto por un patron que nadie
 * habia comprobado que sirviera.
 *
 * `COMMON_SENSITIVE_AREAS` queda FUERA de esta comprobacion y no es una
 * excepcion comoda: esa lista es para los proyectos AUDITADOS —auth, pagos,
 * migraciones, secretos—, y que no encaje con nada en este repositorio es
 * exactamente lo que se espera. La innegociable, en cambio, nombra ficheros de
 * ESTE repositorio: ahi un patron sin objetivo es siempre un error.
 */
const IGNORADAS = new Set(['node_modules', 'dist', 'out', 'coverage', '.git'])

function todos(dir: string, raiz: string): readonly string[] {
  return readdirSync(dir).flatMap((entrada) => {
    if (IGNORADAS.has(entrada)) return []
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) return todos(ruta, raiz)
    return [ruta.slice(raiz.length + 1)]
  })
}

const FICHEROS = todos(process.cwd(), process.cwd())

describe('la lista innegociable no tiene patrones muertos', () => {
  it('el barrido ve el repositorio: si no, esta prueba no probaria nada', () => {
    expect(FICHEROS.length).toBeGreaterThan(500)
    expect(FICHEROS).toContain('src/infrastructure/electron/main-window.ts')
  })

  it.each([...AUTONOMY_RULES_FILES])('%s protege algo que existe', (patron) => {
    // Si esto falla, el fichero se movio: la respuesta es SEGUIR a la defensa
    // hasta su ruta nueva, no borrar el patron para que la prueba pase.
    const alcanza = FICHEROS.filter((f) => matchesGlob(f, patron))
    expect({ patron, protege: alcanza.length }).toEqual({ patron, protege: alcanza.length || 1 })
  })

  it('el patron muerto que lo destapo NO habria pasado esta prueba', () => {
    expect(FICHEROS.some((f) => matchesGlob(f, 'electron/**'))).toBe(false)
    expect(FICHEROS.some((f) => matchesGlob(f, 'src/infrastructure/electron/**'))).toBe(true)
  })

  it('las areas del proyecto AUDITADO no se miden con esta vara', () => {
    expect(COMMON_SENSITIVE_AREAS.some((p) => !FICHEROS.some((f) => matchesGlob(f, p)))).toBe(true)
  })
})
