import { describe, expect, it } from 'vitest'
import { isFortressRepo } from './self-project'

describe('isFortressRepo: como FORTRESS se reconoce a si misma', () => {
  it('reconoce su propio repo leyendo el package.json de verdad', () => {
    // Sin dobles: en vitest el cwd ES la raiz de este repo, asi que la
    // comprobacion se hace contra el manifiesto real. Es lo unico que prueba
    // que la identidad no depende de una ruta adivinada.
    expect(isFortressRepo(process.cwd())).toBe(true)
  })

  it('una carpeta sin manifiesto no es el repo propio', () => {
    expect(isFortressRepo('/tmp')).toBe(false)
  })

  it('mira el NOMBRE del paquete, no que haya un package.json', () => {
    // node_modules/electron tiene manifiesto y no es FORTRESS.
    expect(isFortressRepo(`${process.cwd()}/node_modules/electron`)).toBe(false)
  })
})
