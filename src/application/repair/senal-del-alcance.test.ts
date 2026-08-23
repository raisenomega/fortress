import { describe, expect, it } from 'vitest'
import { CERCO, LIBRE, MEDIO, SIN_CERCO, VETADO } from './freno-cerco-fixture'
import { bench } from './plan-repair-fixture'
import { resumenCerco } from './resumen-cerco'

describe('la senal cuenta las dos cosas, que son dos preguntas', () => {
  it('trabajables y auto-integrables no son el mismo numero', () => {
    // Los tres se pueden trabajar —ninguno es defensa del motor— pero solo el
    // LOW fuera de la lista del proyecto podria integrarse solo.
    const b = bench({ findings: [VETADO, LIBRE, MEDIO], cerco: CERCO })
    expect(resumenCerco(b.context, 'p1')).toEqual({
      total: 3,
      trabajables: 3,
      autoIntegrables: 1,
      elegibles: 3
    })
  })

  it('sin cerco declarado, todo lo trabajable es tambien auto-integrable', () => {
    const b = bench({ findings: [VETADO, MEDIO], cerco: SIN_CERCO })
    expect(resumenCerco(b.context, 'p1')).toEqual({
      total: 2,
      trabajables: 2,
      autoIntegrables: 2,
      elegibles: 2
    })
  })

  it('una defensa del motor no cuenta como trabajable', () => {
    const defensa = { ...LIBRE, id: 'f-def', file: 'src/infrastructure/run-guard.ts' }
    const b = bench({ findings: [LIBRE, defensa], cerco: CERCO })
    expect(resumenCerco(b.context, 'p1')).toMatchObject({ total: 2, trabajables: 1 })
  })
})

describe('los elegibles son los que la cola elegiria AHORA', () => {
  it('descuenta los que ya tienen propuesta viva, como la seleccion', () => {
    // Trabajables cuenta lo que el motor PODRIA tocar; elegibles, lo que le
    // queda por delante. Confundirlos hacia que el panel dijera veinte cuando
    // el drenaje ya habia atendido a la mitad.
    const b = bench({ findings: [VETADO, LIBRE, MEDIO], cerco: CERCO, liveIds: ['f-libre'] })
    const r = resumenCerco(b.context, 'p1')

    expect(r.trabajables).toBe(3)
    expect(r.elegibles).toBe(2)
  })

  it('descuenta tambien los fantasmas del escaneo vigente', () => {
    const b = bench({ findings: [VETADO, LIBRE], cerco: CERCO, obsoleteIds: ['f-vetado'] })
    expect(resumenCerco(b.context, 'p1').elegibles).toBe(1)
  })

  it('sin repo git no se inventa una cola: cero elegibles', () => {
    const b = bench({ findings: [LIBRE], cerco: CERCO, sha: null })
    expect(resumenCerco(b.context, 'p1').elegibles).toBe(0)
  })
})
