import { describe, expect, it } from 'vitest'
import { DEFECTOS } from './tipo-de-defecto'
import { promptDeRetipado } from './prompt-de-retipado'

const ITEM = {
  id: 'f1',
  file: 'src/LoginForm.tsx',
  line: 60,
  title: 'labels no asociados',
  severity: 'HIGH'
}

describe('promptDeRetipado: elegir SOLO de la lista, y otro si de verdad no encaja', () => {
  it('lleva el vocabulario entero con definiciones y desempates, incluidos los seis de ADR-100', () => {
    const p = promptDeRetipado([ITEM])
    expect(p).toContain(`accesibilidad: ${DEFECTOS.accesibilidad}`)
    expect(p).toContain('Dato personal de un titular -> privacidad')
  })

  it('pide otro honesto, no un tipo forzado, y no toca titulo, severidad ni simbolo', () => {
    const p = promptDeRetipado([ITEM])
    expect(p).toMatch(/pon "otro"/)
    expect(p).toContain('NO cambies el titulo, la severidad ni el simbolo')
    expect(p).not.toContain('OBSOLETO')
  })

  it('nombra los hallazgos y pide el bloque "retipadas" con id, tipo y razon', () => {
    const p = promptDeRetipado([ITEM])
    expect(p).toContain('"file": "src/LoginForm.tsx"')
    expect(p).toContain('{"retipadas":[{"id":"…","tipo":"…","razon":"…"}]}')
  })
})
