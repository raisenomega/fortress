import { describe, expect, it } from 'vitest'
import { MODELO_DE_OMEGA } from '@domain/agent/escalera-de-modelos'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'
import { argsDeLectura, argsDelGenerador } from './generator-args'

/**
 * ADR-078 (enmienda 2026-10-05): ningun agente HEREDA el modelo del CLI. Medido
 * esa noche: los cuatro del Motor salian sin `--model` y el CLI les dio Fable
 * —prohibido por doctrina (ADR-088 Enm. 3: 30 dias de retencion)— y a otra hora
 * Opus. Heredar es loteria. Cada proceso del Motor es UN agente, asi que su
 * `--model` por proceso es exactamente un modelo por agente.
 */
const modeloDe = (args: readonly string[]): string | undefined => args[args.indexOf('--model') + 1]

describe('los cuatro del Motor declaran su modelo', () => {
  it('OMEGA corre con MODELO_DE_OMEGA, que es opus (ADR-088 Enm. 3, al fin construido)', () => {
    expect(MODELO_DE_OMEGA).toBe('opus')
    const r = argsDeLectura('p', '/tmp', null, 'omega')
    expect(r.ok && modeloDe(r.value.args)).toBe(MODELO_DE_OMEGA)
  })

  it('analista y critico declaran opus', () => {
    for (const rol of ['analista', 'critico'] as const) {
      const r = argsDeLectura('p', '/tmp', null, rol)
      expect(r.ok && modeloDe(r.value.args)).toBe('opus')
    }
  })

  it('el generador declara opus (excepcion deliberada a «ejecuta→sonnet»)', () => {
    const r = argsDelGenerador('p', '/tmp', null)
    expect(r.ok && modeloDe(r.value.args)).toBe(MODELO_POR_ROL.generador)
    expect(MODELO_POR_ROL.generador).toBe('opus')
  })

  it('ningun rol del reparto es Fable: prohibido por doctrina', () => {
    expect(Object.values(MODELO_POR_ROL)).not.toContain('fable')
  })
})
