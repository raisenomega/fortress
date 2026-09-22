import { describe, expect, it } from 'vitest'
import { codigo, fuente, todos } from '@domain/repair/innegociables-fixture'

/**
 * Todo git que lanza FORTRESS apaga los hooks del repo del cliente (ADR-092,
 * git opcion B), y la lista de lanzadores se DERIVA del codigo. `--no-verify`
 * no vale: salta pre-commit y commit-msg y deja correr post-commit, post-checkout,
 * post-merge y pre-push. Lo que vale es `SIN_HOOKS` en los args, siempre, tambien
 * en los que solo leen: una regla sin excepciones no necesita que nadie juzgue.
 */
const LANZA_GIT = /\b(?:execFile|execFileSync|spawn|spawnSync)\(\s*'git'|\benCaja\(\s*'git'/

const lanzadores = todos.filter((ruta) => LANZA_GIT.test(codigo(fuente(ruta))))

describe('todo git de FORTRESS apaga los hooks del cliente', () => {
  it('el barrido encuentra lanzadores: si no, la regex dejo de valer', () => {
    expect(lanzadores.length).toBeGreaterThanOrEqual(8)
  })

  it.each(lanzadores)('%s pasa SIN_HOOKS en sus args, no solo --no-verify', (ruta) => {
    expect({ ruta, sinHooks: /\.\.\.SIN_HOOKS\b/.test(codigo(fuente(ruta))) }).toEqual({ ruta, sinHooks: true }) // prettier-ignore
  })
})
