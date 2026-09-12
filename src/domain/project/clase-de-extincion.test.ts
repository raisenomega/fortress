import { describe, expect, it } from 'vitest'
import { clasificarExtincion, ganadoraDeLaFusion } from './clase-de-extincion'
import { MOTIVOS_EXTINCION } from './motivo-extincion'

const UUID_A = 'dbf50a77-9d07-473a-b47a-eab59b97ac4b'
const UUID_B = 'f8bbd67a-970c-49cb-92ec-2febbd836960'

describe('de que murio un hallazgo, dicho sin afirmar de mas (ADR-087)', () => {
  it('`juicio_obsoleto` es la UNICA que significa resuelto', () => {
    expect(clasificarExtincion('juicio_obsoleto')).toBe('verificado')
  })

  it('EL PREFIJO captura las veinte fusiones, que son veinte cadenas distintas', () => {
    // La fusion escribe `fusionada-con-<uuid de la superviviente>` por SQL
    // directo. Un mapa por valor exacto las perderia TODAS.
    expect(clasificarExtincion(`fusionada-con-${UUID_A}`)).toBe('fusionado')
    expect(clasificarExtincion(`fusionada-con-${UUID_B}`)).toBe('fusionado')
    expect(ganadoraDeLaFusion(`fusionada-con-${UUID_A}`)).toBe(UUID_A)
  })

  it('EL CAJON CAE A `sin-prueba`, nunca a `verificado`', () => {
    // Ahi esta la diferencia con `aArea`, cuyo cajon es neutro. Un motivo que no
    // se reconozca no puede volverse una afirmacion: seria la pantalla diciendo
    // que alguien comprobo algo que nadie comprobo.
    expect(clasificarExtincion(null)).toBe('sin-prueba')
    expect(clasificarExtincion(undefined)).toBe('sin-prueba')
    expect(clasificarExtincion('')).toBe('sin-prueba')
    expect(clasificarExtincion('motivo_raro_del_futuro')).toBe('sin-prueba')
    expect(clasificarExtincion('ausencia_historica')).toBe('sin-prueba')
    expect(clasificarExtincion('fusionada')).toBe('sin-prueba')
  })

  it('y NO depende del vocabulario cerrado, que se le queda corto', () => {
    // `ausencia_historica` esta declarado y tiene CERO filas —las 27 de agosto
    // son NULL a secas—, y las 20 de fusion no estan declaradas en absoluto.
    // Clasificar por esa lista habria perdido 47 de las 55.
    const vocabulario: readonly string[] = MOTIVOS_EXTINCION
    expect(vocabulario).not.toContain(`fusionada-con-${UUID_A}`)
    expect(clasificarExtincion(`fusionada-con-${UUID_A}`)).toBe('fusionado')
  })

  it('la ganadora solo sale de una fusion de verdad', () => {
    expect(ganadoraDeLaFusion('juicio_obsoleto')).toBeNull()
    expect(ganadoraDeLaFusion(null)).toBeNull()
    expect(ganadoraDeLaFusion('fusionada-con-')).toBeNull()
  })
})
