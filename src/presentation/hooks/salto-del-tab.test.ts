import { describe, expect, it } from 'vitest'
import { saltoDelTab } from './salto-del-tab'

describe('el Tab no se escapa del dialogo', () => {
  it('desde el ultimo, Tab vuelve al primero', () => {
    expect(saltoDelTab(3, 2, false)).toBe(0)
  })

  it('desde el primero, Shift+Tab va al ultimo', () => {
    expect(saltoDelTab(3, 0, true)).toBe(2)
  })

  it('entre dos controles de en medio no interviene: el navegador ya acierta', () => {
    expect(saltoDelTab(3, 1, false)).toBeNull()
    expect(saltoDelTab(3, 1, true)).toBeNull()
    expect(saltoDelTab(3, 0, false)).toBeNull()
    expect(saltoDelTab(3, 2, true)).toBeNull()
  })

  // El foco arranca en la CAJA del dialogo, no en un control: asi un «Confirmar»
  // destructivo no queda armado bajo el Enter de quien acaba de abrirlo.
  it('con el foco en la caja o fuera, entra por el extremo que toca', () => {
    expect(saltoDelTab(3, -1, false)).toBe(0)
    expect(saltoDelTab(3, -1, true)).toBe(2)
  })

  it('con un solo control, Tab y Shift+Tab se quedan en el', () => {
    expect(saltoDelTab(1, 0, false)).toBe(0)
    expect(saltoDelTab(1, 0, true)).toBe(0)
  })

  it('sin nada enfocable no hay a donde saltar', () => {
    expect(saltoDelTab(0, -1, false)).toBeNull()
    expect(saltoDelTab(0, -1, true)).toBeNull()
  })
})
