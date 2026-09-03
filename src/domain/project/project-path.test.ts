import { describe, expect, it } from 'vitest'
import { isAbsoluteProjectPath } from './project-path'

describe('isAbsoluteProjectPath: absoluta Y sin salirse con ".."', () => {
  it('acepta las tres formas absolutas', () => {
    expect(isAbsoluteProjectPath('/home/jojo/proyecto')).toBe(true)
    expect(isAbsoluteProjectPath('C:\\Users\\jojo\\proyecto')).toBe(true)
    expect(isAbsoluteProjectPath('\\\\servidor\\recurso')).toBe(true)
  })

  it('rechaza lo que no es absoluto', () => {
    expect(isAbsoluteProjectPath('../relativa')).toBe(false)
    expect(isAbsoluteProjectPath('proyecto')).toBe(false)
    expect(isAbsoluteProjectPath('')).toBe(false)
  })

  it('rechaza `..` — los casos que pasaban antes', () => {
    // Los tres se midieron ejecutando la version vieja: los tres ACEPTABA.
    expect(isAbsoluteProjectPath('/home/jojo/../../etc')).toBe(false)
    expect(isAbsoluteProjectPath('/a/b/../../../..')).toBe(false) // normaliza a "/"
    expect(isAbsoluteProjectPath('C:\\x\\..\\..')).toBe(false)
  })

  it('rechaza `..` en cualquier posicion, con las dos barras', () => {
    expect(isAbsoluteProjectPath('/..')).toBe(false)
    expect(isAbsoluteProjectPath('/a/../b')).toBe(false)
    expect(isAbsoluteProjectPath('/a/b/..')).toBe(false)
    expect(isAbsoluteProjectPath('\\\\servidor\\..\\otro')).toBe(false)
    expect(isAbsoluteProjectPath('/a\\../b')).toBe(false) // barras mezcladas
  })

  it('un ".." DENTRO de un nombre no sale de ningun sitio: se acepta', () => {
    // Mirar por subcadena en vez de por segmento rechazaria carpetas legitimas.
    expect(isAbsoluteProjectPath('/srv/app..old')).toBe(true)
    expect(isAbsoluteProjectPath('/srv/..oculto')).toBe(true)
    expect(isAbsoluteProjectPath('/srv/dos..puntos/dentro')).toBe(true)
  })

  it('lo que no es texto no es una ruta', () => {
    for (const v of [null, undefined, 42, {}, ['/tmp'], { toString: () => '/tmp' }]) {
      expect(isAbsoluteProjectPath(v)).toBe(false)
    }
  })
})
