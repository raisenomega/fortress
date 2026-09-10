import { describe, expect, it } from 'vitest'
import { leerPlantilla } from './leer-plantilla'
import { promptDeParada } from './prompt-de-parada'

/**
 * Sin un Electron vivo, `app` es undefined y `app.getPath` revienta. Es la
 * forma mas dura de «no hay carpeta que leer», y sirve de banco de pruebas: si
 * la ausencia se aguanta AQUI, se aguanta con una carpeta que sencillamente no
 * existe. La primera version de este modulo dejaba esa llamada fuera del try y
 * lanzaba en vez de devolver null; el escaneo se habria caido por no tener
 * sembrada una plantilla, que es lo contrario de lo que promete el ADR.
 */
describe('la ausencia de plantilla nunca revienta', () => {
  it('leerPlantilla devuelve null en vez de lanzar', () => {
    expect(leerPlantilla('M8')).toBeNull()
  })

  it('y el prompt se compone igual, con su aviso y la checklist', () => {
    const compuesto = promptDeParada({
      projectPath: process.cwd(),
      projectName: 'FORTRESS',
      projectId: 'p1',
      rutas: ['src/api'],
      modulos: ['M8']
    })

    expect(compuesto).toContain('su plantilla no esta sembrada en audit-kit')
    expect(compuesto).toContain('Reglas:')
  })
})
