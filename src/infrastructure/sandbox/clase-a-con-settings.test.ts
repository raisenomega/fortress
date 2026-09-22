import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Todo `claude -p` que lance FORTRESS lleva el sandbox del CLI (ADR-092, clase
 * A), y la lista de quien lo lanza se DERIVA: es un fichero que hace
 * `spawn(<el binario de claude>, …)`. Un lanzador nuevo que no pase por
 * `conSandbox` cae aqui, sin que nadie se acuerde de mirar. Se juzga codigo, no
 * comentarios: el sandbox lo pone quien arma los args, y el que lanza tiene que
 * lanzar ESO — un `Result` que se comprueba antes del spawn.
 */
const RAIZ = 'src'
const ES_TEST = /\.test\.ts$|fixture|fake|de-mentira/

function ficheros(dir: string): readonly string[] {
  return readdirSync(dir).flatMap((entrada) => {
    const ruta = join(dir, entrada)
    if (statSync(ruta).isDirectory()) return ficheros(ruta)
    return ruta.endsWith('.ts') && !ES_TEST.test(ruta) ? [ruta] : []
  })
}

const codigo = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** Quien LANZA el CLI con un prompt: `spawn(CLAUDE_BIN|claudeBin|bin, …)` y
 *  arma o recibe args con `-p`. Los `spawnSync(CLAUDE_BIN, ['--version'])` y
 *  `['auth', …]` no llevan prompt y quedan fuera: no corren nada del proyecto. */
const lanzadores = ficheros(RAIZ)
  .map((ruta) => ({ ruta, fuente: codigo(readFileSync(ruta, 'utf8')) }))
  .filter(({ fuente }) => /\bspawn\((?:CLAUDE_BIN|claudeBin|bin),/.test(fuente))

/** Quien ARMA los args con `-p`: ahi tiene que entrar `conSandbox`. */
const armadores = ficheros(RAIZ)
  .map((ruta) => ({ ruta, fuente: codigo(readFileSync(ruta, 'utf8')) }))
  .filter(({ fuente }) => /\[\s*'-p'\s*,/.test(fuente))

describe('todo claude -p lleva el sandbox del CLI', () => {
  it('las listas se derivan y NO estan vacias: si el barrido falla, se nota', () => {
    expect(lanzadores.length).toBeGreaterThanOrEqual(6)
    expect(armadores.length).toBeGreaterThanOrEqual(4)
  })

  it.each(armadores.map((a) => a.ruta))('%s arma sus args pasando por conSandbox', (ruta) => {
    const fuente = codigo(readFileSync(ruta, 'utf8'))
    // `buildArgs` es la excepcion nombrada: devuelve el array crudo y el sandbox
    // lo pone `args-del-turno`, que es el UNICO que lo consume para lanzar.
    const pasa = /\bconSandbox\(/.test(fuente) || ruta.endsWith('claude-cli.ts')
    expect({ ruta, pasa }).toEqual({ ruta, pasa: true })
  })

  it.each(lanzadores.map((l) => l.ruta))(
    '%s solo lanza args que vienen de un Result comprobado',
    (ruta) => {
      const fuente = codigo(readFileSync(ruta, 'utf8'))
      // Lo que se lanza es `[...x.value]` o `[...args.value]`: un Result ya abierto.
      // Un array LITERAL sin `-p` (`['auth', 'login']`, `['cli', 'index_repository']`)
      // no es un turno con prompt: no corre nada del proyecto y no entra aqui.
      const spawns = [...fuente.matchAll(/\bspawn\((?:CLAUDE_BIN|claudeBin|bin),\s*([^,]+),/g)]
        .map((m) => m[1]?.trim() ?? '')
        .filter((x) => !(x.startsWith('[') && !x.includes("'-p'")))
      const crudos = spawns.filter((x) => !/\.value\]$/.test(x))
      expect({ ruta, crudos }).toEqual({ ruta, crudos: [] })
    }
  )
})
