import { describe, expect, it } from 'vitest'
import type { DrenajeResultado } from '@application/repair/drenar-hasta-omega'
import { parteDelDrenaje } from './parte-del-drenaje'

const r = (over: Partial<DrenajeResultado> = {}): DrenajeResultado => ({
  fin: 'sin-candidato',
  trabajadas: 0,
  acumuladas: 0,
  vetadas: 0,
  porPresupuesto: 0,
  porTimeout: 0,
  otrasBajas: 0,
  ...over
})

describe('el parte dice que hizo la corrida', () => {
  it('el caso que confundio: 3 trabajadas, 2 a firma, 1 por presupuesto', async () => {
    // El parte viejo decia "2 esperando firma, no queda nada elegible" y
    // parecia que el drenaje habia parado antes de tiempo.
    const { texto } = parteDelDrenaje(r({ trabajadas: 3, acumuladas: 2, porPresupuesto: 1 }))

    expect(texto).toContain('3 trabajadas')
    expect(texto).toContain('2 esperando firma')
    expect(texto).toContain('1 por presupuesto')
    expect(texto).toContain('no queda nada elegible')
  })

  it('cada baja va con su causa, y varias causas caben juntas', () => {
    const { texto } = parteDelDrenaje(r({ trabajadas: 4, acumuladas: 1, vetadas: 2, otrasBajas: 1 })) // prettier-ignore
    expect(texto).toContain('2 vetadas por el revisor')
    expect(texto).toContain('1 por gate o correa')
  })

  it('un timeout se cuenta como timeout, nunca como gate o correa', () => {
    // Era la ultima mentira del parte: el reloj salia con el uniforme del gate.
    const { texto } = parteDelDrenaje(r({ trabajadas: 3, acumuladas: 2, porTimeout: 1 }))
    expect(texto).toContain('1 por timeout')
    expect(texto).not.toContain('gate o correa')
  })

  it('sin bajas no se menciona ninguna perdida', () => {
    expect(parteDelDrenaje(r({ trabajadas: 2, acumuladas: 2 })).texto).not.toContain('perdieron')
  })

  it('agotar el pozo es un exito; los topes y la parada, avisos', () => {
    expect(parteDelDrenaje(r({ trabajadas: 1, acumuladas: 1 })).tono).toBe('ok')
    expect(parteDelDrenaje(r({ fin: 'tope-gasto', trabajadas: 1 })).tono).toBe('aviso')
    expect(parteDelDrenaje(r({ fin: 'detenido', trabajadas: 1 })).tono).toBe('aviso')
    expect(parteDelDrenaje(r({ fin: 'averia', trabajadas: 1 })).tono).toBe('error')
  })

  it('una corrida que no llego a trabajar lo dice sin inventar numeros', () => {
    expect(parteDelDrenaje(r({ fin: 'tope-gasto' })).texto).toBe(
      'Drenaje sin trabajo: tope de gasto alcanzado.'
    )
  })
})
