import { describe, expect, it } from 'vitest'
import { crearFocoDeVentana } from './foco-de-ventana'

describe('el foco de la ventana vuelve a reconciliar el proyecto activo (pieza B del arco #4)', () => {
  it('sin proyecto enfocado, volver a la ventana no reconcilia nada', () => {
    const llamadas: string[] = []
    const foco = crearFocoDeVentana((id) => void llamadas.push(id))
    foco.ventanaActiva()
    expect(llamadas).toEqual([])
  })

  it('enfocar reconcilia; volver a la ventana reconcilia OTRA VEZ el mismo proyecto', () => {
    const llamadas: string[] = []
    const foco = crearFocoDeVentana((id) => void llamadas.push(id))
    foco.enfocar('p1')
    foco.ventanaActiva()
    expect(llamadas).toEqual(['p1', 'p1'])
  })

  it('el ultimo enfocado manda: tras cambiar a p2, la ventana reconcilia p2 y no p1', () => {
    const llamadas: string[] = []
    const foco = crearFocoDeVentana((id) => void llamadas.push(id))
    foco.enfocar('p1')
    foco.enfocar('p2')
    foco.ventanaActiva()
    expect(llamadas).toEqual(['p1', 'p2', 'p2'])
  })
})
