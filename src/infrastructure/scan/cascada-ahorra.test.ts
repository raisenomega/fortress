import { rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { SIN_DECLARACION } from '@domain/scan/declaracion-de-modulos'
import type { ModuloAuditoria } from '@domain/scan/modulo-auditoria'
import type { Juez } from './juez-de-aplicabilidad'
import { medirProyecto } from './medir-proyecto'
import { repoCon } from './repo-fixture'

/** Un juez que no juzga: solo apunta a quien le mandaron juzgar. */
function espia(): { juez: Juez; llamadas: ModuloAuditoria[][] } {
  const llamadas: ModuloAuditoria[][] = []
  const juez: Juez = (_path, modulos) => {
    llamadas.push([...modulos])
    return Promise.resolve(modulos.map((modulo) => ({ modulo, aplica: 'si', porque: 'a.ts:1' })))
  }
  return { llamadas, juez }
}

let repo = ''

afterEach(() => {
  if (repo !== '') rmSync(repo, { recursive: true, force: true })
})

/** Un repo con una fuente y el package.json que se le pida. */
function conDependencia(dep: string | null): string {
  repo = repoCon({ 'src/domain/a.ts': 'export const a = 1\n' })
  writeFileSync(join(repo, 'package.json'), dep === null ? '{}' : `{"dependencies":{"${dep}":"1"}}`)
  return repo
}

describe('la cascada ahorra el spawn cuando ya sabe la respuesta', () => {
  it('con stripe, al juez NO se le pregunta por M8', async () => {
    const { juez, llamadas } = espia()

    await medirProyecto(conDependencia('stripe'), SIN_DECLARACION, juez)

    expect(llamadas).toEqual([['M3']])
  })

  it('sin pasarela, se le pregunta por los dos', async () => {
    const { juez, llamadas } = espia()

    await medirProyecto(conDependencia(null), SIN_DECLARACION, juez)

    expect(llamadas).toEqual([['M3', 'M8']])
  })

  it('con los dos declarados, el juez NO se invoca ni una vez', async () => {
    const { juez, llamadas } = espia()

    await medirProyecto(conDependencia(null), { M3: true, M8: false }, juez)

    expect(llamadas).toEqual([])
  })

  it('la declaracion manda aunque stripe este ahi: M8 fuera, y sin juicio', async () => {
    const { juez, llamadas } = espia()

    const manifiesto = await medirProyecto(conDependencia('stripe'), { M8: false }, juez)

    expect(manifiesto.modulosAplicables).not.toContain('M8')
    expect(llamadas).toEqual([['M3']])
  })
})
