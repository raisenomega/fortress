import { describe, expect, it } from 'vitest'
import { bench } from './plan-repair-fixture'
import { APARTE, CONTENIDO } from './plan-repair-dirigido-fixture'
import { planRepair } from './plan-repair'
import { propuesta } from './propuesta-del-plan'

describe('lo que dirigir NO puede saltarse', () => {
  it('un dirigido CRITICAL SI se trabaja: la escalera se completo el 2026-10-04', async () => {
    // La regla no cambio —dirigir pasa por isDebutEligible, el mismo guard que
    // la cola—; cambio el terreno, con la enmienda firmada de ADR-106 (§3.3
    // cumplida por 9f69a37c/2655c77). Ya no queda severidad fuera con la que
    // probar el rechazo; si DEBUT se recortara, este camino volveria a negar.
    const b = bench({ findings: [APARTE({ severity: 'CRITICAL' })] })
    expect(await planRepair(b.context, 'p1', 'f-dirigido')).toMatchObject({ ok: true })
    expect(b.inserted).toHaveLength(1)
  })

  it('un dirigido que ya tiene propuesta viva no se paga dos veces', async () => {
    // El unico descuento de la cola que el dirigido conserva, y es por dinero:
    // re-analizar lo que ya se esta trabajando cuesta una corrida entera.
    const b = bench({ findings: [APARTE()], liveIds: ['f-dirigido'] })
    expect(await planRepair(b.context, 'p1', 'f-dirigido')).toMatchObject({ ok: false, reason: 'sin-candidato' })
  })

  it('un dirigido descontado por FANTASMA del escaneo vigente si se trabaja', async () => {
    // Ese descuento existe para que el motor no re-analice fantasmas por su
    // cuenta; un humano que lo pide esta pidiendo justamente que se verifique.
    const b = bench({ findings: [APARTE()], obsoleteIds: ['f-dirigido'] })
    expect(propuesta(await planRepair(b.context, 'p1', 'f-dirigido'))?.findingId).toBe('f-dirigido')
  })

  it('un hallazgo que ya no esta activo no se puede dirigir', async () => {
    const b = bench({ findings: [APARTE({ lifecycle: 'MITIGATED' })] })
    expect(await planRepair(b.context, 'p1', 'f-dirigido')).toMatchObject({ ok: false, reason: 'sin-candidato' })
  })

  it('un findingId que no existe en el proyecto no inventa objetivo', async () => {
    const b = bench({ findings: [CONTENIDO] })
    expect(await planRepair(b.context, 'p1', 'f-fantasma')).toMatchObject({ ok: false, reason: 'sin-candidato' })
    expect(b.inserted).toHaveLength(0)
  })
})
