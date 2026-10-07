import { describe, expect, it } from 'vitest'
import { paraLaFila, sumarModelo } from './modelo-del-recorrido'

const OPUS = 'claude-opus-5-5'
const HAIKU = 'claude-haiku-4-5-20251001'

describe('el modelo del recorrido, parada a parada', () => {
  it('la primera parada lo estrena', () => {
    expect(sumarModelo(undefined, OPUS)).toBe(OPUS)
  })

  it('uniforme: todas iguales, se queda ese', () => {
    expect(sumarModelo(OPUS, OPUS)).toBe(OPUS)
  })

  it('mezcla: gana el PELDANO MAS BAJO visto, en los dos ordenes', () => {
    expect(sumarModelo(OPUS, HAIKU)).toBe(HAIKU)
    expect(sumarModelo(HAIKU, OPUS)).toBe(HAIKU)
  })

  it('una parada sin modelo envenena: afirmar uno seria inferir', () => {
    expect(sumarModelo(OPUS, undefined)).toBeNull()
    expect(sumarModelo(undefined, undefined)).toBeNull()
  })

  it('el veneno no se cura con paradas posteriores', () => {
    expect(sumarModelo(null, OPUS)).toBeNull()
  })

  it('una familia desconocida cuenta como la mas baja: no se le afirma altura', () => {
    expect(sumarModelo(OPUS, 'modelo-raro-9')).toBe('modelo-raro-9')
  })

  it('mismo peldano con ids distintos: se queda el ya visto (fold estable)', () => {
    expect(sumarModelo(OPUS, 'claude-opus-4-8')).toBe(OPUS)
  })
})

describe('lo que se escribe en la fila', () => {
  it('un modelo es un modelo; null y «sin paradas» acaban igual: fila sin modelo', () => {
    expect(paraLaFila(OPUS)).toBe(OPUS)
    expect(paraLaFila(null)).toBeUndefined()
    expect(paraLaFila(undefined)).toBeUndefined()
  })
})
