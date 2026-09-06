import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { AUTONOMY_RULES_FILES } from './auto-merge-blacklist'

/**
 * La lista innegociable se ha quedado corta CUATRO veces, y siempre igual: una
 * defensa se muda a un fichero nuevo y la lista, que sigue al fichero, se queda
 * mirando donde ya no esta. `buildEnv` salio de `claude-cli`; `sanearParaPrompt`
 * de `knownFindings`; el turno del arbol de `apply-auto-merge`.
 *
 * Esto no deriva la lista entera —el criterio es un juicio y no un patron—, pero
 * si la CLASE que se ha escapado siempre: quien construye un entorno, quien
 * sanea texto ajeno y quien toma un turno. Un fichero nuevo que exporte una de
 * esas y no entre en la lista falla aqui, sin que nadie se acuerde de mirar.
 */
const CONTROLES =
  /export (?:async )?function (build\w*Env|gitEnv\w*|redactSecrets|sanear\w+|guard\w+|conCarril\w+)\b/

const ficheros = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((e) => {
    const ruta = join(dir, e)
    if (statSync(ruta).isDirectory()) return ficheros(ruta)
    return ruta.endsWith('.ts') && !/\.test\.ts$|fixture|fake/.test(ruta) ? [ruta] : []
  })

/** Un fichero esta cubierto por su ruta exacta o por un glob de carpeta. */
const cubierto = (f: string): boolean =>
  AUTONOMY_RULES_FILES.some((p) => p === f || (p.endsWith('/**') && f.startsWith(p.slice(0, -2))))

/**
 * La otra clase que se escapo, y por la misma razon: `main-window` decidia el
 * aislamiento del renderer y la lista lo cubria con `electron/**`, un patron que
 * no encajaba con su ruta real. Quien DECIDE si el renderer esta aislado —donde
 * quiera que viva— tiene que estar cubierto.
 */
const AISLAMIENTO = /\b(nodeIntegration|contextIsolation|exposeInMainWorld)\b/

const fuente = (f: string): string => readFileSync(f, 'utf8')
const todos = ficheros('src')
const defensas = todos.filter((f) => CONTROLES.test(fuente(f)))
const ventanas = todos.filter((f) => AISLAMIENTO.test(fuente(f)))

describe('toda defensa esta en la lista que el auto-merge no puede tocar', () => {
  it('el barrido encuentra defensas: si no, la regex dejo de valer', () => {
    expect(defensas.length).toBeGreaterThan(3)
  })

  it.each(defensas)('%s es innegociable', (fichero) => {
    // Si esto falla al mover una guarda, la respuesta NO es aflojar la regex:
    // es anadir el fichero. La defensa se mudo; la proteccion tiene que seguirla.
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })

  it.each(ventanas)('%s decide el aislamiento del renderer: innegociable', (fichero) => {
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })

  it('la lista se cubre a si misma, y tambien el modulo que la parte', () => {
    // Sin esto, una propuesta podria integrar sola el borrado de la proteccion.
    expect(cubierto('src/domain/repair/auto-merge-blacklist.ts')).toBe(true)
    expect(cubierto('src/domain/repair/innegociables-defensa.ts')).toBe(true)
  })
})
