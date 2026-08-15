import { describe, expect, it } from 'vitest'
import { AYER, banco, corrida, MEDIANOCHE } from './agent-run-aggregates-fixture'

describe('usageSince: el tope de gasto cuenta TODO lo que gasta', () => {
  it('sin corridas la suma es cero, no nula', () => {
    // COALESCE existe justo para esto: SUM sobre cero filas devuelve NULL, y un
    // NULL viajando como gasto haria comparaciones que siempre son falsas.
    expect(banco().agg.usageSince(MEDIANOCHE).costUsd).toBe(0)
  })

  it('suma chat, escaneo y motor SIN filtrar por tipo', () => {
    // De aqui sale el tope diario y el de la sesion del loop. El motor entra en
    // la cuenta porque esta consulta no distingue quien gasto: si alguien le
    // anadiera un filtro por tipo, el motor volveria a gastar por fuera.
    const { db, agg } = banco()
    corrida(db, { kind: 'chat', costUsd: 1 })
    corrida(db, { kind: 'scan', costUsd: 2 })
    corrida(db, { kind: 'repair', costUsd: 5 })

    expect(agg.usageSince(MEDIANOCHE).costUsd).toBe(8)
  })

  it('tampoco filtra por proyecto: la cuenta del dia es una sola', () => {
    const { db, agg } = banco()
    corrida(db, { projectId: 'p1', kind: 'repair', costUsd: 3 })
    corrida(db, { projectId: 'p2', kind: 'chat', costUsd: 4 })

    expect(agg.usageSince(MEDIANOCHE).costUsd).toBe(7)
  })

  it('lo de ayer queda fuera de la ventana', () => {
    const { db, agg } = banco()
    corrida(db, { costUsd: 9, at: AYER })
    corrida(db, { costUsd: 1 })

    expect(agg.usageSince(MEDIANOCHE).costUsd).toBe(1)
  })
})

describe('usageByProjectSince: la misma ventana, separada por proyecto', () => {
  it('cada proyecto lleva su propia cuenta', () => {
    const { db, agg } = banco()
    corrida(db, { projectId: 'p1', kind: 'repair', costUsd: 3 })
    corrida(db, { projectId: 'p1', kind: 'chat', costUsd: 1 })
    corrida(db, { projectId: 'p2', kind: 'scan', costUsd: 4 })

    const porProyecto = agg.usageByProjectSince(MEDIANOCHE)

    expect(porProyecto.p1?.costUsd).toBe(4)
    expect(porProyecto.p2?.costUsd).toBe(4)
  })

  it('un proyecto sin corridas no aparece, en vez de aparecer en cero', () => {
    const { db, agg } = banco()
    corrida(db, { projectId: 'p1', costUsd: 1 })

    expect(agg.usageByProjectSince(MEDIANOCHE).p2).toBeUndefined()
  })
})
