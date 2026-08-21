import { describe, expect, it } from 'vitest'
import { bench } from './plan-repair-fixture'
import { APARTE, CONTENIDO } from './plan-repair-dirigido-fixture'
import { planRepair } from './plan-repair'

describe('lo que dirigir NO puede saltarse', () => {
  it('un dirigido fuera del estreno (HIGH) no se trabaja: dirigir no lo amplia', async () => {
    // Que el operador pregunte no acumula confianza. Subir el estreno a HIGH es
    // una decision deliberada, y un clic no puede tomarla de lado.
    const b = bench({ findings: [APARTE({ severity: 'HIGH' })] })
    expect(await planRepair(b.context, 'p1', 'f-dirigido')).toBeNull()
    expect(b.inserted).toHaveLength(0)
  })

  it('un dirigido que ya tiene propuesta viva no se paga dos veces', async () => {
    // El unico descuento de la cola que el dirigido conserva, y es por dinero:
    // re-analizar lo que ya se esta trabajando cuesta una corrida entera.
    const b = bench({ findings: [APARTE()], liveIds: ['f-dirigido'] })
    expect(await planRepair(b.context, 'p1', 'f-dirigido')).toBeNull()
  })

  it('un dirigido descontado por FANTASMA del escaneo vigente si se trabaja', async () => {
    // Ese descuento existe para que el motor no re-analice fantasmas por su
    // cuenta; un humano que lo pide esta pidiendo justamente que se verifique.
    const b = bench({ findings: [APARTE()], obsoleteIds: ['f-dirigido'] })
    expect((await planRepair(b.context, 'p1', 'f-dirigido'))?.findingId).toBe('f-dirigido')
  })

  it('un hallazgo que ya no esta activo no se puede dirigir', async () => {
    const b = bench({ findings: [APARTE({ lifecycle: 'MITIGATED' })] })
    expect(await planRepair(b.context, 'p1', 'f-dirigido')).toBeNull()
  })

  it('un findingId que no existe en el proyecto no inventa objetivo', async () => {
    const b = bench({ findings: [CONTENIDO] })
    expect(await planRepair(b.context, 'p1', 'f-fantasma')).toBeNull()
    expect(b.inserted).toHaveLength(0)
  })
})
