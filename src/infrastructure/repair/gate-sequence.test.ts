import { describe, expect, it } from 'vitest'
import type { GateCommand } from '@domain/repair/gate-config'
import type { GateOutcome } from '@domain/repair/gate-result'
import { npmSegunContenido, repoConBase } from './gate-herencia-fixture'
import { createGateRunner } from './gate-runner'

const CMDS: readonly GateCommand[] = [
  { key: 'typecheck', args: ['run', 'typecheck'], timeoutMs: 10_000 },
  { key: 'lint', args: ['run', 'lint'], timeoutMs: 10_000 },
  { key: 'test:unit', args: ['run', 'test:unit'], timeoutMs: 10_000 }
]

/** El gate entero contra un repo de verdad: base, fix y git por medio. */
const correr = async (base: string, fix: string): Promise<GateOutcome> => {
  const { dir, baseSha } = repoConBase(base, fix)
  return createGateRunner(npmSegunContenido(), CMDS, 10_000).run(dir, baseSha)
}

const corridos = (o: GateOutcome): readonly string[] => o.commands.map((c) => c.command)

describe('el gate acumula lo heredado, sigue verificando y lo perdona', () => {
  it('un rojo heredado no corta la cadena, y con el resto verde el gate PASA', async () => {
    // El caso de mailbd, medido: typecheck verde, lint rojo de siempre, tests verdes.
    const outcome = await correr('ERROR\n', 'ERROR\ntocado\n')

    expect(corridos(outcome)).toEqual(['npm ci', 'typecheck', 'lint', 'test:unit'])
    expect(outcome).toMatchObject({ ok: true, heredado: ['lint'] })
  })

  it('con los tres rojos heredados tambien pasa, y los anota los tres', async () => {
    const outcome = await correr('TYPE\nERROR\nROTO\n', 'TYPE\nERROR\nROTO\ntocado\n')

    expect(outcome).toMatchObject({
      ok: true,
      heredado: ['typecheck', 'lint', 'test:unit']
    })
  })

  it('dos rojos heredados de distinto comando se perdonan igual', async () => {
    const outcome = await correr('ERROR\nROTO\n', 'ERROR\nROTO\ntocado\n')

    expect(outcome).toMatchObject({ ok: true, heredado: ['lint', 'test:unit'] })
  })
})

describe('el gate corta en seco cuando el rojo es del fix', () => {
  it('un rojo propio para la cadena en el acto', async () => {
    const outcome = await correr('ok\n', 'ERROR\n')

    expect(corridos(outcome)).toEqual(['npm ci', 'typecheck', 'lint'])
    expect(outcome).toMatchObject({ ok: false, failedAt: 'lint', heredado: [] })
  })

  it('tras uno heredado, un rojo propio manda el veredicto y el gate rechaza', async () => {
    const outcome = await correr('ERROR\n', 'ERROR\nROTO\n')

    expect(outcome).toMatchObject({ ok: false, failedAt: 'test:unit', heredado: ['lint'] })
  })

  it('sin ningun rojo el juicio es verde y no cuenta herencia', async () => {
    const outcome = await correr('ok\n', 'ok\ntocado\n')

    expect(outcome.ok).toBe(true)
    expect(outcome.heredado).toBeUndefined()
  })
})
