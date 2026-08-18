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

describe('el gate acumula lo heredado y sigue verificando', () => {
  it('un rojo heredado ya no corta: los comandos siguientes SI corren', async () => {
    const outcome = await correr('ERROR\n', 'ERROR\ntocado\n')

    expect(corridos(outcome)).toEqual(['npm ci', 'typecheck', 'lint', 'test:unit'])
    expect(outcome).toMatchObject({ ok: false, failedAt: 'lint', heredado: ['lint'] })
  })

  it('los tres rojos heredados se anotan enteros, y falla en el primero', async () => {
    const outcome = await correr('TYPE\nERROR\nROTO\n', 'TYPE\nERROR\nROTO\ntocado\n')

    expect(outcome).toMatchObject({
      ok: false,
      failedAt: 'typecheck',
      heredado: ['typecheck', 'lint', 'test:unit']
    })
  })
})

describe('el gate corta en seco cuando el rojo es del fix', () => {
  it('un rojo propio para la cadena en el acto', async () => {
    const outcome = await correr('ok\n', 'ERROR\n')

    expect(corridos(outcome)).toEqual(['npm ci', 'typecheck', 'lint'])
    expect(outcome).toMatchObject({ ok: false, failedAt: 'lint', heredado: [] })
  })

  it('tras uno heredado, el primer rojo propio manda el veredicto', async () => {
    const outcome = await correr('ERROR\n', 'ERROR\nROTO\n')

    expect(outcome).toMatchObject({ ok: false, failedAt: 'test:unit', heredado: ['lint'] })
  })

  it('sin ningun rojo el juicio es verde y no cuenta herencia', async () => {
    const outcome = await correr('ok\n', 'ok\ntocado\n')

    expect(outcome.ok).toBe(true)
    expect(outcome.heredado).toBeUndefined()
  })
})
