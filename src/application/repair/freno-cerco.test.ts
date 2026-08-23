import { describe, expect, it } from 'vitest'
import { CERCO, LIBRE, MEDIO, SIN_CERCO, VETADO } from './freno-cerco-fixture'
import { bench } from './plan-repair-fixture'
import { planRepair } from './plan-repair'

describe('la cola no elige lo que el cerco va a denegar', () => {
  it('un hallazgo cuyo fichero esta excluido no se elige, y no paga analista', async () => {
    const b = bench({ findings: [VETADO], cerco: CERCO })
    expect(await planRepair(b.context, 'p1')).toBeNull()
    expect(b.inserted).toHaveLength(0)
  })

  it('un MEDIUM donde el cerco solo admite LOW tampoco se elige', async () => {
    const b = bench({ findings: [MEDIO], cerco: CERCO })
    expect(await planRepair(b.context, 'p1')).toBeNull()
  })

  it('teniendo los dos delante, elige el que si puede aspirar', async () => {
    const b = bench({ findings: [VETADO, LIBRE], cerco: CERCO })
    expect((await planRepair(b.context, 'p1'))?.findingId).toBe('f-libre')
  })

  it('no-regresion: el LOW fuera de la lista sigue siendo elegible el solo', async () => {
    const b = bench({ findings: [LIBRE], cerco: CERCO })
    expect((await planRepair(b.context, 'p1'))?.state).toBe('ANALIZADO')
  })
})

describe('donde no hay cerco, el freno no aplica', () => {
  it('un proyecto sin bloque autoMerge sigue eligiendo: no se apaga el motor', async () => {
    // Si esto se rompe, mailbd —el unico proyecto con el loop encendido— deja
    // de trabajar en silencio. Sin cerco todo es firma manual por definicion.
    const b = bench({ findings: [VETADO], cerco: SIN_CERCO })
    expect((await planRepair(b.context, 'p1'))?.findingId).toBe('f-vetado')
  })

  it('tampoco aplica si el proyecto no tiene .fortress/config', async () => {
    const b = bench({ findings: [VETADO] })
    expect((await planRepair(b.context, 'p1'))?.findingId).toBe('f-vetado')
  })
})

describe('el operador alcanza a mano lo que la cola descarta', () => {
  it('un dirigido que el cerco denegaria se trabaja igual: nace para firma humana', async () => {
    const b = bench({ findings: [VETADO, LIBRE], cerco: CERCO })
    expect((await planRepair(b.context, 'p1', 'f-vetado'))?.state).toBe('ANALIZADO')
  })
})
