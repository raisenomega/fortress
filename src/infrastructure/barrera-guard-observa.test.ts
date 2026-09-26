import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import type { OperationMode } from '@domain/settings/operation-mode'
import { guardBarrera } from './barrera-guard'
import { banco, conHooks, filasDeAvistamiento, pathSinPython, restaurarPath, ROTO, SANO, unCliente } from './barrera-guard-fixture' // prettier-ignore

const conBarrera = (comando: string, modo: OperationMode): AppContext =>
  banco(unCliente(conHooks(comando)), modo)

beforeAll(pathSinPython)
afterAll(restaurarPath)

describe('la observacion se asienta SIEMPRE, bloquee o no', () => {
  it('cuando EDITA, aunque el turno quede negado', () => {
    const ctx = conBarrera(ROTO, 'autonomo')
    guardBarrera(ctx, 'p1', true)

    expect(ctx.selfObservations.listOpen()).toMatchObject([
      { kind: 'bug', area: 'barrera-del-proyecto', sourceProject: 'Cliente ACME' }
    ])
  })

  it('y cuando NO edita tambien: el backlog se entera aunque no se bloquee', () => {
    const ctx = conBarrera(ROTO, 'supervisado')
    guardBarrera(ctx, 'p1', false)

    expect(ctx.selfObservations.listOpen()).toHaveLength(1)
  })

  it('con la barrera sana NO ensucia el backlog', () => {
    const ctx = conBarrera(SANO, 'autonomo')
    guardBarrera(ctx, 'p1', true)

    expect(ctx.selfObservations.listOpen()).toEqual([])
  })

  it('el sourceProject lo pone el ASENTADOR: el draft del dominio no lo trae', () => {
    const ctx = conBarrera(ROTO, 'autonomo')
    guardBarrera(ctx, 'p1', true)

    expect(ctx.selfObservations.listOpen()[0]?.sourceProject).toBe('Cliente ACME')
  })
})

describe('y la dedup de ADR-085 la respeta', () => {
  it('el mismo proyecto turno tras turno NO abre fila ni infla la senal', () => {
    const ctx = conBarrera(ROTO, 'supervisado')
    for (let i = 0; i < 5; i++) guardBarrera(ctx, 'p1', false)

    const [obs] = ctx.selfObservations.listOpen()
    expect(ctx.selfObservations.listOpen()).toHaveLength(1)
    expect(ctx.selfObservations.vistaEn(obs.id)).toBe(1)
  })

  it('ni deja UN avistamiento por turno: la nota determinista lo funde', () => {
    // El pre-vuelo corre en CADA envio. `vistaEn` no se movia igual —cuenta
    // proyectos—, pero la tabla crecia: el UNIQUE es (obs, proyecto, NOTA), asi
    // que una nota que bailase sembraria una fila por turno para siempre.
    const ctx = conBarrera(ROTO, 'supervisado')
    for (let i = 0; i < 5; i++) guardBarrera(ctx, 'p1', false)

    expect(filasDeAvistamiento(ctx)).toBe(1)
  })

  it('DOS clientes con la barrera rota suman avistamiento: esa es la senal', () => {
    const dos = [...unCliente(conHooks(ROTO)), { id: 'p2', name: 'Otro', path: conHooks(ROTO) }]
    const ctx = banco(dos, 'supervisado')
    guardBarrera(ctx, 'p1', false)
    guardBarrera(ctx, 'p2', false)

    const [obs] = ctx.selfObservations.listOpen()
    expect(ctx.selfObservations.listOpen()).toHaveLength(1)
    expect(ctx.selfObservations.vistaEn(obs.id)).toBe(2)
  })
})
