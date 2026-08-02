import { describe, expect, it } from 'vitest'
import { isInvalid, isStorable, type ApiKeyVerdict } from './api-key-check'

const VALIDA: ApiKeyVerdict = { status: 'valida', model: 'Claude Opus 5' }
const INVALIDA: ApiKeyVerdict = { status: 'invalida', reason: 'revocada' }
const SIN_VERIFICAR: ApiKeyVerdict = { status: 'sin-verificar', reason: 'sin red' }

describe('isStorable', () => {
  it('guarda una key valida', () => {
    expect(isStorable(VALIDA)).toBe(true)
  })

  it('nunca guarda una key invalida: solo aplazaria el error', () => {
    expect(isStorable(INVALIDA)).toBe(false)
  })

  it('guarda la que no se pudo verificar: puede ser falta de red', () => {
    expect(isStorable(SIN_VERIFICAR)).toBe(true)
  })
})

describe('isInvalid', () => {
  it('distingue invalida de sin verificar', () => {
    expect(isInvalid(INVALIDA)).toBe(true)
    expect(isInvalid(SIN_VERIFICAR)).toBe(false)
    expect(isInvalid(VALIDA)).toBe(false)
  })
})
