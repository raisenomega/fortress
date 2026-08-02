import { describe, expect, it } from 'vitest'
import { isValidFolderName, toFolderName } from './folder-name'

describe('toFolderName', () => {
  it('convierte un nombre humano en algo que la terminal digiere', () => {
    expect(toFolderName('Mi App Genial')).toBe('mi-app-genial')
  })

  it('quita tildes y enes: git y npm no las quieren', () => {
    expect(toFolderName('Diseño Rápido')).toBe('diseno-rapido')
  })

  it('colapsa separadores repetidos y los recorta de los bordes', () => {
    expect(toFolderName('  --Hola___Mundo!!  ')).toBe('hola-mundo')
  })

  it('un nombre sin caracteres validos da cadena vacia, no basura', () => {
    expect(toFolderName('¿?¡!')).toBe('')
  })
})

describe('isValidFolderName', () => {
  it('acepta lo que produce toFolderName', () => {
    expect(isValidFolderName('mi-app-genial')).toBe(true)
  })

  it('rechaza vacio, rutas y nombres reservados', () => {
    expect(isValidFolderName('')).toBe(false)
    expect(isValidFolderName('..')).toBe(false)
    expect(isValidFolderName('node_modules')).toBe(false)
  })

  it('rechaza cualquier cosa que pueda salirse de la carpeta padre', () => {
    // Sin esto, un nombre con barra escribiria fuera de donde el operador dijo.
    expect(isValidFolderName('a/b')).toBe(false)
    expect(isValidFolderName('../fuera')).toBe(false)
  })

  it('rechaza mayusculas y espacios', () => {
    expect(isValidFolderName('Mi App')).toBe(false)
  })
})
