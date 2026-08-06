import { describe, expect, it } from 'vitest'
import { classifyFailure } from './failure-kind'

describe('classifyFailure', () => {
  it('credito agotado es transitorio (standby, no muere)', () => {
    expect(classifyFailure('Your credit balance is too low to run this request')).toBe(
      'transitorio'
    )
    expect(classifyFailure('saldo insuficiente en la cuenta')).toBe('transitorio')
  })

  it('limite de tasa, sobrecarga y corte de red son transitorios', () => {
    expect(classifyFailure('429 too many requests')).toBe('transitorio')
    expect(classifyFailure('Overloaded (503)')).toBe('transitorio')
    expect(classifyFailure('getaddrinfo ENOTFOUND api.anthropic.com')).toBe('transitorio')
    expect(classifyFailure('request timeout')).toBe('transitorio')
  })

  it('un fallo claramente terminal no entra en standby', () => {
    expect(classifyFailure('El escaneo no llego a terminar: JSON malformado')).toBe('terminal')
    expect(classifyFailure('project path does not exist')).toBe('terminal')
  })
})
