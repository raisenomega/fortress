import { describe, expect, it } from 'vitest'
import { notaDelCierre } from './nota-del-cierre'

describe('notaDelCierre', () => {
  it('con cero paradas hechas NO hay nota: el escaneo no vio nada', () => {
    // El caso que pintaba 100/100 en el tablero: un escaneo que murio en su
    // primera parada tiene el expediente vacio, y un expediente vacio puntua 100.
    expect(notaDelCierre(100, 0)).toBeNull()
    expect(notaDelCierre(63, 0)).toBeNull()
  })

  it('con una parada hecha SI puntua, aunque luego reventara', () => {
    // Esa nota es honesta: lo auditado mas lo que sigue vivo en la memoria.
    expect(notaDelCierre(63, 1)).toBe(63)
    expect(notaDelCierre(100, 3)).toBe(100)
  })

  it('un cero legitimo de un escaneo que SI vio no se confunde con no haber visto', () => {
    expect(notaDelCierre(0, 2)).toBe(0)
  })
})
