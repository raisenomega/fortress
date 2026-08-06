import { describe, expect, it } from 'vitest'
import { isConfigState, isPending } from './config-state'

describe('config-state', () => {
  it('reconoce solo los estados validos', () => {
    expect(isConfigState('PENDIENTE_CONFIGURACION')).toBe(true)
    expect(isConfigState('CONFIGURADO')).toBe(true)
    expect(isConfigState('otro')).toBe(false)
    expect(isConfigState(null)).toBe(false)
  })

  it('isPending es cierto solo sin marco aprobado', () => {
    expect(isPending('PENDIENTE_CONFIGURACION')).toBe(true)
    expect(isPending('CONFIGURADO')).toBe(false)
  })
})
