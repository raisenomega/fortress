import { describe, expect, it } from 'vitest'
import { bench } from './plan-repair-fixture'
import { APARTE, CONTENIDO, objetivo } from './plan-repair-dirigido-fixture'
import { planRepair } from './plan-repair'
import { propuesta } from './propuesta-del-plan'

describe('el operador dirige la reparacion a un hallazgo concreto', () => {
  it('con findingId el motor atiende ESE, no el que la cola habria elegido', async () => {
    const b = bench({ findings: [CONTENIDO, APARTE()] })
    expect(propuesta(await planRepair(b.context, 'p1', 'f-dirigido'))?.findingId).toBe('f-dirigido')
  })

  it('sin findingId elige la cola, como hasta hoy', async () => {
    const b = bench({ findings: [CONTENIDO, APARTE()] })
    expect(propuesta(await planRepair(b.context, 'p1'))?.findingId).toBe('f-cola')
  })

  it('el objetivo dirigido llega entero: mismo ancla, fichero, linea y severidad', async () => {
    const b = bench({ findings: [CONTENIDO, APARTE()] })
    await planRepair(b.context, 'p1', 'f-dirigido')

    expect(objetivo(b)).toMatchObject({
      id: 'f-dirigido', severity: 'LOW', line: 49,
      file: 'src/infrastructure/ipc/graph-action-handlers.ts'
    }) // prettier-ignore
  })

  it('un dirigido que el cerco denegaria por RUTA se trabaja igual', async () => {
    // `src/infrastructure/ipc/**` esta en la lista de exclusion: ese fix jamas
    // se auto-integrara. Se trabaja porque nace para firma humana, y eso es lo
    // que el freno de coste tendra que seguir respetando.
    const b = bench({ findings: [APARTE()] })
    expect(propuesta(await planRepair(b.context, 'p1', 'f-dirigido'))?.state).toBe('ANALIZADO')
  })

  it('un dirigido que el cerco denegaria por SEVERIDAD se trabaja igual', async () => {
    const b = bench({ findings: [APARTE({ severity: 'MEDIUM' })] })
    expect(propuesta(await planRepair(b.context, 'p1', 'f-dirigido'))?.state).toBe('ANALIZADO')
  })
})
