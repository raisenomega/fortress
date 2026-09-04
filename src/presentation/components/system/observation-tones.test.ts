import { describe, expect, it } from 'vitest'
import { OBSERVATION_STATUSES, type SelfObservation } from '@domain/system/self-observation'
import { recuento } from './observation-recuento'
import { PUNTO_ESTADO, TONO_ESTADO } from './observation-tones'

const obs = (status: SelfObservation['status']): SelfObservation =>
  ({ id: status, status }) as SelfObservation

describe('los tres estados tienen color, y el vocabulario lo garantiza', () => {
  it('ningun estado se queda sin tono ni sin punto', () => {
    // El Record es COMPLETO, no Partial: si el vocabulario gana un estado esto
    // deja de compilar. El test fija ademas que ninguno quede vacio.
    for (const status of OBSERVATION_STATUSES) {
      expect(TONO_ESTADO[status]).toBeTruthy()
      expect(PUNTO_ESTADO[status]).toBeTruthy()
    }
  })

  it('salen de la escala de FORTRESS: verde, amarillo, rojo', () => {
    expect(TONO_ESTADO).toEqual({
      pendiente: 'text-medium',
      atendido: 'text-success',
      descartado: 'text-critical'
    })
  })

  it('el descarte va en ROJO, no en gris: el defecto sigue ahi', () => {
    expect(TONO_ESTADO.descartado).not.toContain('muted')
  })
})

describe('el recuento de la cabecera', () => {
  it('cuenta cada estado por separado', () => {
    const lista = [obs('pendiente'), obs('pendiente'), obs('atendido')]

    expect(recuento(lista)).toEqual([
      { status: 'pendiente', n: 2 },
      { status: 'atendido', n: 1 },
      { status: 'descartado', n: 0 }
    ])
  })

  it('un estado sin filas sale con cero, no desaparece', () => {
    // Recorre el vocabulario, no los datos: que hoy no haya descartes no es lo
    // mismo que no poder haberlos.
    expect(recuento([]).map((r) => r.status)).toEqual([...OBSERVATION_STATUSES])
  })
})
