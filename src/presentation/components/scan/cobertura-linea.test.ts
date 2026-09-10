import { describe, expect, it } from 'vitest'
import type { CoberturaDeclarada } from '@application/scan/scan-types'
import { lineaDeCobertura, tonoDeCobertura } from './cobertura-linea'

const COMPLETO: CoberturaDeclarada = {
  estado: 'CERRADO',
  motivoCierre: 'completo',
  paradasHechas: 12,
  paradasTotal: 12,
  ficherosCubiertos: 340,
  ficherosTotal: 340
}

const CORTADO: CoberturaDeclarada = {
  ...COMPLETO,
  estado: 'ABORTADO',
  motivoCierre: 'abortado',
  paradasHechas: 4,
  ficherosCubiertos: 120
}

describe('la cuenta que convierte «escanee» en «escanee, y aqui esta la cuenta»', () => {
  it('un recorrido entero dice X de Y con las dos cifras iguales', () => {
    expect(lineaDeCobertura(COMPLETO)).toBe('Audito 340 de 340 ficheros · 12 de 12 paradas')
  })

  it('uno cortado dice lo REAL, y por que se corto', () => {
    // 120 de 340. Decir 340 seria afirmar que se miro lo que nadie miro.
    expect(lineaDeCobertura(CORTADO)).toBe('Audito 120 de 340 ficheros · 4 de 12 paradas · lo detuviste') // prettier-ignore
  })

  it('un fallo del escaner se distingue de una parada del operador', () => {
    expect(lineaDeCobertura({ ...CORTADO, motivoCierre: 'fallo' })).toContain('el escaner fallo')
  })

  it('sin manifiesto CALLA en vez de inventarse un total', () => {
    expect(lineaDeCobertura({ ...COMPLETO, ficherosCubiertos: null, ficherosTotal: null })).toBeNull() // prettier-ignore
  })
})

describe('el tono no afirma mas de lo que paso', () => {
  it('verde solo si se miro TODO lo prometido', () => {
    expect(tonoDeCobertura(COMPLETO)).toBe('ok')
  })

  it('un recorrido cortado es neutro: ni error ni exito', () => {
    // Lo guardado vale, asi que no es un fallo; pero pintarlo verde afirmaria
    // que se reviso lo que nadie reviso.
    expect(tonoDeCobertura(CORTADO)).toBe('aviso')
  })
})
