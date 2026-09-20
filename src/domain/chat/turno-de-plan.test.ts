import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '@domain/project/corpus-descriptor'
import { INSTRUCCION_DEL_PLAN } from '../settings/instruccion-de-modo'
import { buildChatPrompt } from './chat-prompt'
import { esTurnoDePlanDelLote } from './turno-de-plan'

const base = { projectName: 'P', corpus: EMPTY_CORPUS, known: ['HIGH a.ts:3 — t'] }
const prompt = (over: Record<string, unknown>): string =>
  buildChatPrompt('resuelve el lote', { ...base, mode: 'supervisado', ...over } as never)

/**
 * BUG 2. El turno de plan del lote viaja con `mode: 'supervisado'` para que NO
 * edite —y eso sigue siendo cierto—, pero recibia la instruccion de supervisado
 * y le decia al agente que esperase aprobacion de un humano que en autonomo no
 * esta. Se le pidieron cuatro decisiones a nadie.
 */
describe('las señas del turno de plan', () => {
  it('con lote y SIN foco es plan; con foco es resolucion', () => {
    expect(esTurnoDePlanDelLote({ deLote: true })).toBe(true)
    expect(esTurnoDePlanDelLote({ deLote: true, enFoco: 'bloque' })).toBe(false)
  })

  it('sin lote no es plan aunque no haya foco: un mensaje suelto no planea', () => {
    expect(esTurnoDePlanDelLote({})).toBe(false)
  })
})

describe('la instruccion del turno de plan no manda esperar a nadie', () => {
  it('manda lo CONTRARIO de esperar, y no repite la orden de supervisado', () => {
    // OJO CON EL MATIZ: la frase correcta CONTIENE «aprobacion» —porque la
    // NIEGA—, asi que un `not.toMatch(/aprobacion/)` tumbaria la instruccion
    // buena. Lo que no puede aparecer es la ORDEN de supervisado.
    expect(INSTRUCCION_DEL_PLAN).toContain('NO esperes aprobacion de nadie')
    expect(INSTRUCCION_DEL_PLAN).not.toContain('espera aprobacion')
    expect(INSTRUCCION_DEL_PLAN).not.toMatch(/supervisado|sin confirmacion/i)
  })

  it('SI dice planear, no editar, y consultar el grafo', () => {
    expect(INSTRUCCION_DEL_PLAN).toMatch(/ORDEN/)
    expect(INSTRUCCION_DEL_PLAN).toMatch(/NO edites/)
    expect(INSTRUCCION_DEL_PLAN).toMatch(/grafo/)
  })

  it('y nombra a OMEGA como quien revisa: el aprobador existe, no es un humano', () => {
    expect(INSTRUCCION_DEL_PLAN).toContain('OMEGA')
  })
})

describe('el prompt entrega la instruccion correcta a cada turno', () => {
  it('turno de plan: la del plan, NO la de supervisado', () => {
    const p = prompt({ deLote: true })

    expect(p).toContain('TURNO DE PLAN')
    expect(p).not.toContain('MODO SUPERVISADO')
  })

  it('turno con foco: la de su modo, intacta', () => {
    const p = prompt({ deLote: true, enFoco: 'bloque', mode: 'autonomo' })

    expect(p).toContain('MODO AUTONOMO')
    expect(p).not.toContain('TURNO DE PLAN')
  })

  it('chat libre en supervisado: intacto, que ahi SI hay a quien esperar', () => {
    const p = prompt({})

    expect(p).toContain('MODO SUPERVISADO')
    expect(p).toContain('espera aprobacion')
  })
})
