import { describe, expect, it } from 'vitest'
import { huellaDelMotivo, motivoDelArreglo } from './motivo-del-arreglo'

describe('el motivo lleva el fichero y la huella del terreno, y se vuelve a leer', () => {
  it('se escribe como prefijo del vocabulario mas sufijo legible', () => {
    expect(motivoDelArreglo('src/infra/x.ts', 'abcd1234')).toBe('arreglo_fuera_de_correa: src/infra/x.ts cfg=abcd1234') // prettier-ignore
  })

  it('la huella se recupera del motivo, tambien cuando no habia config', () => {
    expect(huellaDelMotivo(motivoDelArreglo('src/infra/x.ts', 'abcd1234'))).toBe('abcd1234')
    expect(huellaDelMotivo(motivoDelArreglo('a b/c.ts', 'none'))).toBe('none')
  })

  it('cualquier otro motivo, o uno sin huella, no es de esta causa', () => {
    expect(huellaDelMotivo('scope_violation')).toBeNull()
    expect(huellaDelMotivo('omega_vetado: no cubre')).toBeNull()
    expect(huellaDelMotivo('arreglo_fuera_de_correa')).toBeNull()
    expect(huellaDelMotivo(null)).toBeNull()
    expect(huellaDelMotivo(undefined)).toBeNull()
  })
})
