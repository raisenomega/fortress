import { describe, expect, it } from 'vitest'
import { countEdits, isEditTool } from './edit-tools'

describe('countEdits', () => {
  it('cuenta solo las herramientas que escriben', () => {
    // "Fixes aplicados" no puede incluir lecturas: leer un archivo no arregla
    // nada, y contarlo inflaria la efectividad del agente.
    expect(countEdits(['Read', 'Grep', 'Edit', 'Bash', 'Write'])).toBe(2)
  })

  it('cuenta cada uso, no cada herramienta distinta', () => {
    expect(countEdits(['Edit', 'Edit', 'Edit'])).toBe(3)
  })

  it('es cero si el agente solo miro', () => {
    expect(countEdits(['Read', 'Glob', 'Grep', 'Bash'])).toBe(0)
  })

  it('es cero sin herramientas', () => {
    expect(countEdits([])).toBe(0)
  })
})

describe('isEditTool', () => {
  it('reconoce las cuatro formas de escribir', () => {
    expect(isEditTool('Edit')).toBe(true)
    expect(isEditTool('Write')).toBe(true)
    expect(isEditTool('MultiEdit')).toBe(true)
    expect(isEditTool('NotebookEdit')).toBe(true)
  })

  it('no confunde Bash con una edicion', () => {
    // Bash puede escribir, pero no se puede afirmar sin leer el comando.
    expect(isEditTool('Bash')).toBe(false)
  })
})
