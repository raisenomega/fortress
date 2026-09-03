import { describe, expect, it } from 'vitest'
import { MOTIVOS_DE_RECHAZO } from './atendidos-contrato'
import { leerRegistro, parsearRegistro } from './atendidos-parse'

const buena = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'obs-1', status: 'atendido', reason: 'arreglado', attendedBy: 'claude-code',
  attendedAt: '2026-09-03T10:00:00Z', ...over
}) // prettier-ignore

const motivos = (raw: unknown): string[] => leerRegistro(raw).rechazadas.map((r) => r.motivo)

describe('el registro se lee con tolerancia: lo malo se reporta, no revienta', () => {
  it('una entrada completa pasa, con su fixSha opcional', () => {
    const { validas, rechazadas } = leerRegistro([buena({ fixSha: 'abc1234' })])
    expect(rechazadas).toEqual([])
    expect(validas[0]).toMatchObject({ id: 'obs-1', status: 'atendido', fixSha: 'abc1234' })
  })

  it('sin fixSha tambien pasa: es opcional', () => {
    expect(leerRegistro([buena()]).validas[0].fixSha).toBeNull()
  })

  it('DESCARTAR SIN MOTIVO se rechaza: es el cajon que esto impide', () => {
    expect(motivos([buena({ status: 'descartado', reason: undefined })])).toEqual([
      MOTIVOS_DE_RECHAZO.DESCARTE_SIN_MOTIVO
    ])
    // Con motivo, la misma entrada entra.
    expect(leerRegistro([buena({ status: 'descartado', reason: 'ya no aplica' })].map((e) => e)).validas).toHaveLength(1) // prettier-ignore
  })

  it('atendido SIN motivo se acepta: solo el descarte lo exige', () => {
    expect(leerRegistro([buena({ reason: undefined })]).validas).toHaveLength(1)
  })

  it('importar no es des-atender: pendiente y lo desconocido se rechazan', () => {
    expect(motivos([buena({ status: 'pendiente' })])).toEqual([MOTIVOS_DE_RECHAZO.ESTADO_INVALIDO])
    expect(motivos([buena({ status: 'inventado' })])).toEqual([MOTIVOS_DE_RECHAZO.ESTADO_INVALIDO])
  })

  it('cada campo obligatorio que falte dice cual es', () => {
    expect(motivos([{ status: 'atendido' }])).toEqual([MOTIVOS_DE_RECHAZO.SIN_ID])
    expect(motivos([buena({ attendedBy: '' })])).toEqual([MOTIVOS_DE_RECHAZO.SIN_AUTOR])
    expect(motivos([buena({ attendedAt: undefined })])).toEqual([MOTIVOS_DE_RECHAZO.SIN_FECHA])
    expect(motivos(['no soy un objeto'])).toEqual([MOTIVOS_DE_RECHAZO.NO_ES_OBJETO])
  })
})

describe('el fichero entero: duplicados, mezcla y roturas', () => {
  it('un id repetido invalida SUS DOS entradas: no gana la ultima', () => {
    const r = leerRegistro([buena(), buena({ status: 'descartado', reason: 'otra cosa' })])
    expect(r.validas).toEqual([])
    expect(r.rechazadas.map((x) => x.motivo)).toEqual([
      MOTIVOS_DE_RECHAZO.ID_DUPLICADO,
      MOTIVOS_DE_RECHAZO.ID_DUPLICADO
    ])
  })

  it('lo bueno sobrevive a lo malo del mismo fichero', () => {
    const r = leerRegistro([buena(), { basura: true }, buena({ id: 'obs-2' })])
    expect(r.validas.map((v) => v.id)).toEqual(['obs-1', 'obs-2'])
    expect(r.rechazadas).toHaveLength(1)
  })

  it('un fichero a medio escribir NO lanza: devuelve vacio', () => {
    expect(parsearRegistro('[{"id":"obs-1","stat')).toEqual({ validas: [], rechazadas: [] })
    expect(parsearRegistro('')).toEqual({ validas: [], rechazadas: [] })
    expect(parsearRegistro('{"no":"soy un array"}')).toEqual({ validas: [], rechazadas: [] })
  })
})
