import { describe, expect, it } from 'vitest'
import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import { createMemoryDb } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

const AT = '2026-09-03T10:00:00.000Z'

function repo(): SelfObservationRepository {
  const r = createSqliteSelfObservationRepository(createMemoryDb())
  r.add({ sourceProject: 'p', kind: 'gap', area: 'grafo', note: 'falta algo' })
  return r
}

describe('el estado de una observacion: quien la cerro y por que', () => {
  it('nace pendiente, sin motivo ni autor', () => {
    const [o] = repo().listOpen()
    expect(o).toMatchObject({ status: 'pendiente', reason: null, attendedBy: null, attendedAt: null }) // prettier-ignore
  })

  it('atenderla la saca de los pendientes y guarda quien y por que', () => {
    const r = repo()
    const [antes] = r.listOpen()

    expect(r.setStatus({ id: antes.id, status: 'atendido', reason: 'arreglado en abc1234', attendedBy: 'claude-code', attendedAt: AT })).toBe(true) // prettier-ignore
    expect(r.listOpen()).toHaveLength(0)
  })

  it('descartarla tambien la saca, y el motivo queda', () => {
    const r = repo()
    const [o] = r.listOpen()
    r.setStatus({ id: o.id, status: 'descartado', reason: 'no aplica desde el rediseno', attendedBy: 'operador', attendedAt: AT }) // prettier-ignore

    expect(r.listOpen()).toHaveLength(0)
  })

  it('un id que no existe devuelve false, sin consultar antes', () => {
    // Es como el import detecta una entrada que apunta a nada: por el WHERE.
    expect(repo().setStatus({ id: 'no-existe', status: 'atendido', reason: null, attendedBy: 'x', attendedAt: AT })).toBe(false) // prettier-ignore
  })

  it('listOpen filtra por status, no por el booleano viejo', () => {
    const r = repo()
    const [o] = r.listOpen()
    r.setStatus({ id: o.id, status: 'atendido', reason: null, attendedBy: 'x', attendedAt: AT })

    expect(r.listOpen().map((x) => x.id)).not.toContain(o.id)
  })

  it('el boton viejo sigue funcionando: resolve deja la fila atendida', () => {
    const r = repo()
    r.resolve(r.listOpen()[0].id)

    expect(r.listOpen()).toHaveLength(0)
  })
})
