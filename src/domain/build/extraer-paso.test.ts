import { describe, expect, it } from 'vitest'
import { extraerPaso } from './extraer-paso'

describe('extraerPaso: aisla el bloque PASO del CTO (Sello 2b-a)', () => {
  it('T1a: devuelve el contenido del bloque', () => {
    expect(extraerPaso('bla bla\nPASO:[haz esto]:END-PASO\ny mas')).toBe('haz esto')
  })

  it('T1b: sin bloque -> null (fail-safe: no dispara)', () => {
    expect(extraerPaso('solo converso, pregunto y mido')).toBeNull()
  })

  it('T1c: varios bloques -> el PRIMERO', () => {
    expect(extraerPaso('PASO:[uno]:END-PASO y PASO:[dos]:END-PASO')).toBe('uno')
  })

  it('bloque vacio -> null (nada que ejecutar)', () => {
    expect(extraerPaso('PASO:[   ]:END-PASO')).toBeNull()
  })

  it('contenido multilinea con un ] suelto dentro: no cierra antes de tiempo', () => {
    const texto = 'PASO:[linea 1\narr[0] = x\nlinea 3]:END-PASO'
    expect(extraerPaso(texto)).toBe('linea 1\narr[0] = x\nlinea 3')
  })
})
