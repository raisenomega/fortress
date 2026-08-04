import { describe, expect, it } from 'vitest'
import { findSection, normalize, splitSections } from './sections'

const MARKDOWN = ['# Log', '', '## Patrón activo', 'cuerpo uno', '', '## Reflexión', 'cuerpo dos'].join(
  '\n'
)

describe('normalize', () => {
  it('quita tildes y pasa a mayusculas', () => {
    expect(normalize('Patrón activo')).toBe('PATRON ACTIVO')
  })

  it('recorta los espacios de los extremos', () => {
    expect(normalize('  reflexión  ')).toBe('REFLEXION')
  })
})

describe('splitSections', () => {
  it('parte el markdown por titulos de nivel dos', () => {
    expect(splitSections(MARKDOWN).map((s) => s.heading)).toEqual(['Patrón activo', 'Reflexión'])
  })

  it('separa el encabezado del cuerpo', () => {
    expect(splitSections(MARKDOWN)[0]).toEqual({ heading: 'Patrón activo', body: 'cuerpo uno\n\n' })
  })

  it('ignora el titulo de nivel uno', () => {
    expect(splitSections(MARKDOWN)).toHaveLength(2)
  })

  it('devuelve cuerpo vacio cuando el titulo no tiene contenido', () => {
    expect(splitSections('## Solo titulo')).toEqual([{ heading: 'Solo titulo', body: '' }])
  })

  it('devuelve lista vacia sin titulos de nivel dos', () => {
    expect(splitSections('# Solo nivel uno\ntexto suelto')).toEqual([])
  })

  it('conserva el orden y las repeticiones', () => {
    const headings = splitSections('## Patron\na\n## Patron\nb').map((s) => s.heading)
    expect(headings).toEqual(['Patron', 'Patron'])
  })
})

describe('findSection', () => {
  const sections = splitSections(MARKDOWN)

  it('encuentra la seccion por prefijo', () => {
    expect(findSection(sections, 'Patrón')).toBe('cuerpo uno\n\n')
  })

  it('ignora tildes y mayusculas al buscar', () => {
    expect(findSection(sections, 'reflexion')).toBe('cuerpo dos')
  })

  it('devuelve null cuando la seccion no existe', () => {
    expect(findSection(sections, 'Inexistente')).toBeNull()
  })
})
