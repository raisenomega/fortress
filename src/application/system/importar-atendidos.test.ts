import { describe, expect, it } from 'vitest'
import { MOTIVOS_DE_RECHAZO } from '@domain/system/atendidos-contrato'
import { banco } from './importar-atendidos-fixture'
import { importarAtendidos } from './importar-atendidos'

const AT = '2026-09-03T10:00:00Z'
const entrada = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'obs-1', status: 'atendido', reason: 'arreglado', attendedBy: 'claude-code', attendedAt: AT, ...over
}) // prettier-ignore
const json = (...es: Record<string, unknown>[]): string => JSON.stringify(es)

describe('importar el registro de lo atendido fuera', () => {
  it('atiende y descarta, y el resumen cuadra', () => {
    const b = banco(['obs-1', 'obs-2'])
    const r = importarAtendidos(b.ctx, json(entrada(), entrada({ id: 'obs-2', status: 'descartado', reason: 'no aplica' }))) // prettier-ignore

    expect(r).toMatchObject({ atendidas: 1, descartadas: 1, sobrescritas: 0, rechazadas: [] })
    expect(b.estado('obs-1')).toMatchObject({ status: 'atendido', attendedBy: 'claude-code' })
    expect(b.estado('obs-2')).toMatchObject({ status: 'descartado', reason: 'no aplica' })
  })

  it('un id que no existe se rechaza DICIENDO por que, y no frena al resto', () => {
    const b = banco(['obs-1'])
    const r = importarAtendidos(b.ctx, json(entrada({ id: 'fantasma' }), entrada()))

    expect(r.rechazadas).toEqual([{ id: 'fantasma', motivo: MOTIVOS_DE_RECHAZO.NO_ENCONTRADA }])
    expect(r.atendidas).toBe(1)
  })

  it('pisar un cierre anterior se APLICA y se cuenta aparte', () => {
    const b = banco(['obs-1'])
    importarAtendidos(b.ctx, json(entrada()))
    const r = importarAtendidos(b.ctx, json(entrada({ status: 'descartado', reason: 'me equivoque' }))) // prettier-ignore

    expect(r.sobrescritas).toBe(1)
    expect(b.estado('obs-1')).toMatchObject({ status: 'descartado', reason: 'me equivoque' })
  })
})

describe('reimportar, el fixSha y las roturas', () => {
  it('reimportar lo mismo no falla ni cambia nada: es idempotente', () => {
    const b = banco(['obs-1'])
    importarAtendidos(b.ctx, json(entrada()))
    const antes = b.estado('obs-1')
    const r = importarAtendidos(b.ctx, json(entrada()))

    expect(b.estado('obs-1')).toEqual(antes)
    expect(r).toMatchObject({ atendidas: 1, sobrescritas: 1, rechazadas: [] })
  })

  it('el fixSha viaja pegado al motivo, sin columna propia', () => {
    const b = banco(['obs-1'])
    importarAtendidos(b.ctx, json(entrada({ fixSha: 'abc1234' })))

    expect(b.estado('obs-1')?.reason).toBe('arreglado [fix: abc1234]')
  })

  it('un fichero roto no lanza ni toca nada', () => {
    const b = banco(['obs-1'])
    const r = importarAtendidos(b.ctx, '[{"id":"obs-1","stat')

    expect(r).toMatchObject({ atendidas: 0, descartadas: 0, rechazadas: [] })
    expect(b.estado('obs-1')?.status).toBe('pendiente')
  })

  it('el lote entero va en UNA transaccion', () => {
    const b = banco(['obs-1', 'obs-2'])
    importarAtendidos(b.ctx, json(entrada(), entrada({ id: 'obs-2' })))

    expect(b.transacciones()).toBe(1)
  })
})
