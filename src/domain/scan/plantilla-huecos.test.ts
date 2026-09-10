import { describe, expect, it } from 'vitest'
import { bloqueDePlantillas } from './bloque-de-plantillas'
import { delKit } from './plantilla-fixture'
import { sustituirHuecos } from './plantilla-placeholders'
import { resumenDeModulo } from './resumen-de-modulo'

describe('ningun hueco sobrevive al prompt', () => {
  it('{{SERVER_DIRS}} pasa a ser la carpeta de la parada', () => {
    const m8 = resumenDeModulo(delKit('M8'), 'src/api', 'Proyecto') ?? ''

    expect(m8).toContain("'balance|credit|debit")
    expect(m8).toContain('src/api | head -100')
    expect(m8).not.toContain('{{SERVER_DIRS}}')
  })

  it('y {{CLIENT_DIRS}} tambien: es la misma carpeta, la de esta parada', () => {
    expect(resumenDeModulo(delKit('M9'), 'src/ui', 'P')).toContain('src/ui')
  })

  it.each([delKit('M3'), delKit('M8'), delKit('M9'), delKit('M2')])(
    '$modulo sale sin un solo {{...}}',
    (plantilla) => {
      const resumen = resumenDeModulo(plantilla, 'src/api', 'Proyecto') ?? ''

      expect(resumen.match(/\{\{[A-Z_]+\}\}/g)).toBeNull()
    }
  )

  it('un hueco que nadie conoce cae al centinela, no se cuela', () => {
    expect(sustituirHuecos('mira {{INVENTADO}} ahi', 'src/api', 'P')).toBe('mira sin declarar ahi')
  })

  it('dos huecos de carpeta seguidos no repiten la ruta en el comando', () => {
    const m3 = resumenDeModulo(delKit('M3'), 'src/api', 'P') ?? ''

    expect(m3).toContain('src/api | head -80')
    expect(m3).not.toContain('src/api src/api')
  })

  it('el bloque entero tampoco: es lo que de verdad llega al agente', () => {
    const bloque = bloqueDePlantillas(
      { carpeta: 'src/api', modulos: ['M3', 'M8'], plantillas: [delKit('M3'), delKit('M8')] },
      'Proyecto'
    )

    expect(bloque.match(/\{\{[A-Z_]+\}\}/g)).toBeNull()
  })
})
