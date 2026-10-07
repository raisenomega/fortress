import { beforeEach, describe, expect, it } from 'vitest'
import { useConstruirStore } from './construir-store'

/** PASO 80: el texto del plan va APARECIENDO como borrador y el final entra
 *  UNA vez — ni se pierde un trozo ni se duplica el mensaje. */
describe('el borrador del construir', () => {
  beforeEach(() => useConstruirStore.setState({ messages: [], draft: null, busy: false }))

  it('acumula los trozos en orden: el parcial CRECE, no se sobrescribe', () => {
    const s = useConstruirStore.getState()
    s.appendDraft('el plan ')
    s.appendDraft('va saliendo')
    expect(useConstruirStore.getState().draft).toBe('el plan va saliendo')
  })

  it('al terminar, el texto autoritativo entra UNA vez y el borrador se va', () => {
    const s = useConstruirStore.getState()
    s.appendDraft('parcial que no manda')
    s.finishDraft('EL PLAN FINAL')
    const estado = useConstruirStore.getState()
    expect(estado.messages).toEqual([{ role: 'assistant', text: 'EL PLAN FINAL' }])
    expect(estado.draft).toBeNull()
  })
})
