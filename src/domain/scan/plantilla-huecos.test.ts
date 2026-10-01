import { describe, expect, it } from 'vitest'
import { bloqueDePlantillas } from './bloque-de-plantillas'
import { enCarpeta } from './plantilla-fixture'
import { sintetica } from './plantilla-sintetica'
import { sustituirHuecos } from './plantilla-placeholders'
import { resumenDeModulo } from './resumen-de-modulo'

// Contra la SINTETICA: esto prueba el CODIGO de la sustitucion, y el kit no
// viaja al worktree del gate del Motor (ADR-108 §5).
describe('ningun hueco sobrevive al prompt', () => {
  it('{{SERVER_DIRS}} pasa a ser la carpeta de la parada', () => {
    const m8 = resumenDeModulo(sintetica('M8'), enCarpeta('src/api'), 'Proyecto') ?? ''

    expect(m8).toContain("'uno|dos'")
    expect(m8).toContain('src/api | head -7')
    expect(m8).not.toContain('{{SERVER_DIRS}}')
  })

  it('y {{CLIENT_DIRS}} tambien: es la misma carpeta, la de esta parada', () => {
    expect(resumenDeModulo(sintetica('M9'), enCarpeta('src/ui'), 'P')).toContain('src/ui')
  })

  it.each([sintetica('M3'), sintetica('M8'), sintetica('M9'), sintetica('M2')])(
    '$modulo sale sin un solo {{...}}',
    (plantilla) => {
      const resumen = resumenDeModulo(plantilla, enCarpeta('src/api'), 'Proyecto') ?? ''

      expect(resumen.match(/\{\{[A-Z_]+\}\}/g)).toBeNull()
    }
  )

  it('un hueco que nadie conoce cae al centinela, no se cuela', () => {
    expect(sustituirHuecos('mira {{INVENTADO}} ahi', 'src/api', 'P')).toBe('mira sin declarar ahi')
  })

  it('dos huecos de carpeta seguidos no repiten la ruta en el comando', () => {
    const m3 = resumenDeModulo(sintetica('M3'), enCarpeta('src/api'), 'P') ?? ''

    expect(m3).toContain('src/api | head -7')
    expect(m3).not.toContain('src/api src/api')
  })

  it('el bloque entero tampoco: es lo que de verdad llega al agente', () => {
    const bloque = bloqueDePlantillas(
      { ...enCarpeta('src/api'), modulos: ['M3', 'M8'], plantillas: [sintetica('M3'), sintetica('M8')] }, // prettier-ignore
      'Proyecto'
    )

    expect(bloque.match(/\{\{[A-Z_]+\}\}/g)).toBeNull()
  })
})
