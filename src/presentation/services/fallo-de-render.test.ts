import { describe, expect, it } from 'vitest'
import { manejarFalloDeRender, type Bitacora } from './fallo-de-render'

const ARBOL = '\n    at div\n    at ScanView (http://localhost/ScanView.tsx:12:3)\n    at App'
const RUTA_DEL_CLIENTE = '/media/disco/ACME/src/api/billing.ts'

function bitacoraFalsa(): { bitacora: Bitacora; lineas: unknown[][] } {
  const lineas: unknown[][] = []
  return { lineas, bitacora: (que, error, arbol) => void lineas.push([que, error, arbol]) }
}

describe('las dos lecturas de un fallo de render (ADR-086, embudo 3)', () => {
  it('LA NOTA se queda con la clase; el texto crudo va a la bitacora', () => {
    const b = bitacoraFalsa()
    const error = new TypeError(`no pude pintar ${RUTA_DEL_CLIENTE}`)

    const nota = manejarFalloDeRender(error, { componentStack: ARBOL }, b.bitacora)

    expect(nota.note).toBe('FORTRESS rompio pintando ScanView: TypeError')
    expect(nota.note).not.toContain(RUTA_DEL_CLIENTE)
    expect(b.lineas[0][1]).toBe(error)
    expect(b.lineas[0][2]).toBe(ARBOL)
  })

  it('y no lanza aunque React entregue un arbol vacio o algo raro', () => {
    // Corre DENTRO del manejador de un fallo: lanzar aqui convertiria un error
    // de render en dos. Misma regla que la red de los embudos 1 y 2.
    const b = bitacoraFalsa()

    expect(() => manejarFalloDeRender(null, {}, b.bitacora)).not.toThrow()
    expect(manejarFalloDeRender('un texto suelto', {}, b.bitacora).note).toBe(
      'FORTRESS rompio pintando desconocido: desconocido'
    )
  })
})
