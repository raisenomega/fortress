import { describe, expect, it } from 'vitest'
import { AREAS_DE_OBSERVACION } from './area-de-observacion'
import { observacionDeRender } from './observacion-de-render'

/** Tal como React 19 lo entrega: marcos `at X`, mezclando componentes de
 *  FORTRESS con elementos del DOM. */
const ARBOL = `
    at div
    at ScanView (http://localhost/src/presentation/components/scan/ScanView.tsx:12:3)
    at AppShell
    at App`

describe('lo que FORTRESS aprenderia cuando una vista revienta (ADR-086)', () => {
  it('ASIENTA LA CLASE: que componente rompio y de que tipo fue el error', () => {
    const nota = observacionDeRender(ARBOL, 'TypeError')

    expect(nota.kind).toBe('bug')
    expect(nota.note).toBe('FORTRESS rompio pintando ScanView: TypeError')
  })

  it('EL MESSAGE NO ENTRA, ni el arbol entero', () => {
    // Un error de render nace de los datos que el componente pintaba, y esos
    // son del cliente: un hallazgo lleva `file` y `line` del codigo auditado.
    const error = new TypeError('no pude pintar /media/disco/ACME/src/api/billing.ts:140')

    const nota = observacionDeRender(ARBOL, error.name)

    expect(nota.note).not.toContain(error.message)
    expect(nota.note).not.toContain('/media/')
    expect(nota.note).not.toContain('AppShell')
    expect(nota.note).toBe('FORTRESS rompio pintando ScanView: TypeError')
  })

  it('SIN AREA: el tipo garantiza que nadie la asiente antes de la firma', () => {
    // No es un `SelfNoteDraft`, asi que `add` no la acepta. La desconexion es el
    // compilador y no un comentario, que se puede ignorar.
    expect(observacionDeRender(ARBOL, 'Error')).not.toHaveProperty('area')
  })

  it('y `fallo-de-render` NO esta en el vocabulario todavia', () => {
    // Area y emisor nacen juntos (ADR-081). Las otras tres si estan: tienen
    // quien las emita desde los embudos 1 y 2.
    const areas: readonly string[] = AREAS_DE_OBSERVACION
    expect(areas).not.toContain('fallo-de-render')
    expect(areas).toContain('fallo-de-arranque')
    expect(areas).toContain('fallo-de-ipc')
  })
})
