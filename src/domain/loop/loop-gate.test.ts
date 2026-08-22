import { describe, expect, it } from 'vitest'
import { esHastaGate, LOOP_SELF_REPO_BLOCK, loopBlocked } from './loop-gate'

/** El caso en regla: confianza, topes y un repo AJENO en modo completo. */
const OK = { trusted: true, selfRepo: false, configured: true, hastaGate: false }

describe('loopBlocked', () => {
  it('deja correr con confianza, topes y repo ajeno', () => {
    expect(loopBlocked(OK)).toBeNull()
  })

  it('el repo propio EN MODO COMPLETO se bloquea: integrar pide firma', () => {
    expect(loopBlocked({ ...OK, selfRepo: true })).toBe(LOOP_SELF_REPO_BLOCK)
  })

  it('el repo propio HASTA EL GATE si corre: trabaja y acumula, no integra', () => {
    // Lo prohibido no es tocar el codigo propio —eso ocurre dentro de un
    // worktree y es inocuo— sino integrarlo sin que un humano lo autorice.
    expect(loopBlocked({ ...OK, selfRepo: true, hastaGate: true })).toBeNull()
  })

  it('hasta-gate no perdona lo demas: la confianza y los topes siguen', () => {
    const propio = { ...OK, selfRepo: true, hastaGate: true }
    expect(loopBlocked({ ...propio, trusted: false })).toMatch(/confianza/)
    expect(loopBlocked({ ...propio, configured: false })).toMatch(/topes/)
  })

  it('sin confianza no corre', () => {
    expect(loopBlocked({ ...OK, trusted: false })).toMatch(/confianza/)
  })

  it('sin topes guardados no corre', () => {
    expect(loopBlocked({ ...OK, configured: false })).toMatch(/topes/)
  })
})

describe('esHastaGate: el modo no se elige, se deriva del proyecto', () => {
  it('el repo propio va siempre hasta el gate', () => {
    // Que sea funcion y no ajuste es lo que impide que las dos mitades —el
    // gate y quien arma el motor— acaben diciendo cosas distintas.
    expect(esHastaGate(true)).toBe(true)
  })

  it('cualquier otro proyecto corre la vuelta entera, como hasta hoy', () => {
    expect(esHastaGate(false)).toBe(false)
  })
})
