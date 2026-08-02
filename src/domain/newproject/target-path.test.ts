import { describe, expect, it } from 'vitest'
import { joinPath, resolveTarget } from './target-path'

describe('joinPath', () => {
  it('no duplica la barra si el padre ya la trae', () => {
    expect(joinPath('/home/jojo/Escritorio/', 'app')).toBe('/home/jojo/Escritorio/app')
  })
})

describe('resolveTarget', () => {
  it('compone la ruta final con el nombre normalizado', () => {
    const target = resolveTarget('/home/jojo/Escritorio', 'Mi App Genial')
    expect(target.ok && target.value).toBe('/home/jojo/Escritorio/mi-app-genial')
  })

  it('exige elegir donde antes de nada', () => {
    expect(resolveTarget('', 'app').ok).toBe(false)
  })

  it('rechaza un nombre que escribiria fuera de la carpeta elegida', () => {
    // "../.ssh" normalizado queda en "ssh", pero si el normalizador fallara
    // esta comprobacion es la que evita escribir donde nadie pidio.
    const raro = resolveTarget('/home/jojo/Escritorio', '../../../etc')
    expect(raro.ok && raro.value).toBe('/home/jojo/Escritorio/etc')
  })

  it('rechaza un nombre sin caracteres utilizables', () => {
    const vacio = resolveTarget('/home/jojo/Escritorio', '###')
    expect(vacio.ok).toBe(false)
    expect(!vacio.ok && vacio.error).toContain('letras, numeros y guiones')
  })
})
