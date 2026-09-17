import { describe, expect, it } from 'vitest'
import { conVeredicto, deps, EJES, ENTRADA, META } from './juicio-de-omega-fixture'
import { juzgar } from './juicio-de-omega'
import type { OmegaAgentResult } from './run-omega'

/**
 * ADR-090, Fase A. El juicio ya no sabe que existe una `RepairProposal`: se le
 * dan un arbol, un plano de 8 campos y el corpus, y devuelve veredicto sin
 * escribir nada. Estos tests lo piden como lo pedira el Terminal —sin un solo
 * tipo del Motor delante— que es la prueba de que el desacople es real.
 */
describe('el juicio de OMEGA, ya sin el Motor detras', () => {
  it('juzga desde un plan que NO es un Analysis: el Terminal puede pedirlo', async () => {
    const d = deps(conVeredicto({ ...EJES, veredicto_global: 'APROBADO', razon: 'ok' }))
    const juicio = await juzgar(ENTRADA, d)

    expect(juicio.computed).toBe('APROBADO')
    expect(d.prompt()).toContain('falta Content-Security-Policy')
    expect(d.prompt()).toContain('anadir la CSP')
  })

  it('D19 se queda en el nucleo: el motor recomputa y el desacuerdo viaja', async () => {
    // El agente DICE aprobado, pero un eje duro en NO veta por codigo.
    const miente = { ...EJES, respeta_scope: 'NO', veredicto_global: 'APROBADO', razon: 'r' } as const // prettier-ignore
    const juicio = await juzgar(ENTRADA, deps(conVeredicto(miente)))

    expect(juicio.computed).toBe('VETADO')
    expect(juicio.declarado).toBe('APROBADO')
  })

  it('si la corrida fallo no hay veredicto, y el tipo lo dice', async () => {
    const roto: OmegaAgentResult = { ok: false, error: 'timeout', timedOut: true, runMeta: META }
    const juicio = await juzgar(ENTRADA, deps(roto))

    expect(juicio.computed).toBeNull()
    expect(juicio.declarado).toBeNull()
  })

  it('NO escribe: al juzgar no se le pasa contexto en el que pudiera asentar', async () => {
    // La garantia es de tipos, y se dice aqui para que se note si alguien la
    // afloja: `DepsDelJuicio` no lleva `AppContext`, ni eventLog, ni repos.
    const d = deps(conVeredicto({ ...EJES, veredicto_global: 'APROBADO', razon: 'ok' }))

    expect(Object.keys(d).sort()).toEqual(
      ['changedFiles', 'diffText', 'omega', 'prompt', 'readPost', 'readPre'].sort()
    )
  })
})
