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

  it('rechaza un padre relativo: el destino no lo decide el renderer', () => {
    const relativo = resolveTarget('Escritorio/proyectos', 'app')
    expect(relativo.ok).toBe(false)
    expect(!relativo.ok && relativo.error).toContain('absoluta')
  })

  it('rechaza un padre que se sale de si mismo con ".."', () => {
    // Sin esto se listaria (y se crearia) fuera de la carpeta elegida.
    expect(resolveTarget('/home/jojo/../../etc', 'app').ok).toBe(false)
    expect(resolveTarget('C:\\Users\\jojo\\..\\..\\Windows', 'app').ok).toBe(false)
  })

  it('rechaza un padre que ni siquiera es texto, sin reventar', () => {
    expect(resolveTarget(null as unknown as string, 'app').ok).toBe(false)
  })

  it('acepta el padre de Windows, que llega con la otra barra', () => {
    const win = resolveTarget('C:\\Users\\jojo', 'Mi App')
    expect(win.ok && win.value.endsWith('mi-app')).toBe(true)
  })

  it('rechaza un nombre sin caracteres utilizables', () => {
    const vacio = resolveTarget('/home/jojo/Escritorio', '###')
    expect(vacio.ok).toBe(false)
    expect(!vacio.ok && vacio.error).toContain('letras, numeros y guiones')
  })
})
