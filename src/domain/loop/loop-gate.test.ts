import { describe, expect, it } from 'vitest'
import { LOOP_SELF_REPO_BLOCK, loopBlocked } from './loop-gate'

/** El caso en regla: confianza, topes y un repo AJENO. */
const OK = { trusted: true, selfRepo: false, configured: true }

describe('loopBlocked', () => {
  it('deja correr con confianza, topes y repo ajeno', () => {
    expect(loopBlocked(OK)).toBeNull()
  })

  it('el repo propio se bloquea SIEMPRE, aunque todo lo demas este en regla', () => {
    expect(loopBlocked({ ...OK, selfRepo: true })).toBe(LOOP_SELF_REPO_BLOCK)
  })

  it('el repo propio gana a cualquier otra combinacion', () => {
    expect(loopBlocked({ trusted: false, selfRepo: true, configured: false })).toBe(
      LOOP_SELF_REPO_BLOCK
    )
  })

  it('sin confianza no corre', () => {
    expect(loopBlocked({ ...OK, trusted: false })).toMatch(/confianza/)
  })

  it('sin topes guardados no corre', () => {
    expect(loopBlocked({ ...OK, configured: false })).toMatch(/topes/)
  })
})
