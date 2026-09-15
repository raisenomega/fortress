import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { AGENT_CATALOG, esInterruptor, findAgent } from './agent-catalog'
import { buildAgentsPayload } from './agent-prompt'
import { CIMA, peldanoDeDebajo } from './escalera-de-modelos'
import { PRODUCTOR } from './productor'

const fuente = readFileSync(join(process.cwd(), 'src/domain/agent/productor.ts'), 'utf8')

describe('el productor del Terminal (ADR-088, Enmienda 2)', () => {
  it('esta en el catalogo, activo, con carta propia', () => {
    expect(findAgent('productor')).toBe(PRODUCTOR)
    expect(PRODUCTOR.enabledByDefault).toBe(true)
    expect(PRODUCTOR.charter).toContain('PRODUCTOR del Terminal')
  })

  it('su modelo es el peldano de debajo de la cima: opus hoy', () => {
    expect(PRODUCTOR.model).toBe(peldanoDeDebajo(CIMA))
    expect(PRODUCTOR.model).toBe('opus')
  })

  it('su fichero NO escribe el modelo como literal: lo lee de la escalera', () => {
    // Compilan igual un `model: 'opus'` y un `model: MODELO_DEL_PRODUCTOR`; solo
    // el segundo sube cuando sube la cima. Por eso se mira el fuente.
    expect(fuente).toContain('model: MODELO_DEL_PRODUCTOR')
    expect(fuente).not.toMatch(/model:\s*['"]/)
  })

  it('viaja por --agents con ese modelo, como el resto del reparto', () => {
    expect(buildAgentsPayload([PRODUCTOR], EMPTY_CORPUS).productor.model).toBe('opus')
  })

  it('no es un interruptor del operador; todos los demas si lo son', () => {
    expect(esInterruptor(PRODUCTOR)).toBe(false)
    const otros = AGENT_CATALOG.filter((agent) => agent.id !== 'productor')
    expect(otros.every(esInterruptor)).toBe(true)
  })
})
