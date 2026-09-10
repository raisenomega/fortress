import { describe, expect, it } from 'vitest'
import { MODULOS_DE_CARPETA } from './modulos-de-carpeta'
import { MODULOS_DE_TEMA, paradasDeTema } from './modulos-de-tema'
import { esDeCarpeta, esDeTema, ficherosDe, rotuloDe, type Parada } from './parada'

const CARPETA: Parada = { clase: 'carpeta', carpeta: 'src/api', ficheros: ['src/api/a.ts'] }
const TEMA: Parada = { clase: 'tema', modulo: 'M2', rotulo: 'M2 DR/BCP — todo el proyecto' }

describe('las dos clases de parada', () => {
  it('una de carpeta trae carpeta y ficheros; una de tema, modulo y rotulo', () => {
    expect(esDeCarpeta(CARPETA) && CARPETA.carpeta).toBe('src/api')
    expect(esDeTema(TEMA) && TEMA.modulo).toBe('M2')
  })

  it('los temas se rotulan solos, con su nombre y su alcance', () => {
    expect(paradasDeTema(['M2', 'M9']).map(rotuloDe)).toEqual(['M2 DR/BCP — todo el proyecto'])
  })

  it('una parada de tema por modulo aplicable, ni una mas', () => {
    expect(paradasDeTema(['M2', 'M4', 'M7', 'M11', 'M12']).map((p) => p.modulo)).toEqual(
      MODULOS_DE_TEMA
    )
    expect(paradasDeTema(['M3', 'M8', 'M9'])).toEqual([])
  })

  it('carpeta y tema no comparten ni un modulo: cada uno mira lo suyo', () => {
    const ambos = MODULOS_DE_TEMA.filter((m) => MODULOS_DE_CARPETA.includes(m))

    expect(ambos).toEqual([])
  })
})

describe('un tema no cubre ficheros, cubre una dimension', () => {
  it('la carpeta suma los suyos; el tema suma cero', () => {
    expect(ficherosDe(CARPETA)).toBe(1)
    expect(ficherosDe(TEMA)).toBe(0)
  })
})
