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
  porCorrea: 0,
  porLimitePropio: 0,
  porEntornoDelProyecto: 0,
  porDefectoInterno: 0,
  superadas: 0,
  sinClasificar: 0,
  ...over
})

describe('el parte nombra la causa correcta de cada baja', () => {
  it('cada casilla dice su causa, y ninguna manda a leer un diff que no existe', () => {
    const { texto } = parteDelDrenaje(
      r({ trabajadas: 6, porCorrea: 1, porLimitePropio: 1, porEntornoDelProyecto: 1, porDefectoInterno: 1, superadas: 1, sinClasificar: 1 }) // prettier-ignore
    )

    expect(texto).toContain('1 por el gate o la correa')
    expect(texto).toContain('1 sin turnos (no se llego a juzgar el fix)')
    expect(texto).toContain('1 por el entorno del proyecto')
    expect(texto).toContain('1 por un fallo nuestro, no de la propuesta')
    expect(texto).toContain('1 reemplazada o reclamada')
    expect(texto).toContain('1 con un motivo que no sabemos nombrar')
  })

  it('lo que NO es del gate ni de la correa deja de anunciarse como si lo fuera', () => {
    // El defecto entero: turnos agotados, un bug nuestro o una reemplazada se
    // contaban "por gate o correa" y mandaban a leer un diff inexistente.
    const { texto } = parteDelDrenaje(
      r({ trabajadas: 3, porLimitePropio: 1, porDefectoInterno: 1, superadas: 1 })
    )

    expect(texto).not.toContain('gate')
    expect(texto).not.toContain('correa')
  })

  it('ocupado NO es averia: es un aviso, no un error en rojo', () => {
    const ocupado = parteDelDrenaje(r({ fin: 'ocupado', detalle: 'tope diario' }))
    const averia = parteDelDrenaje(r({ fin: 'averia' }))

    expect(ocupado.tono).toBe('aviso')
    expect(ocupado.texto).toContain('el motor esta ocupado')
    expect(ocupado.texto).not.toContain('averia')
    expect(averia.tono).toBe('error')
  })
})
