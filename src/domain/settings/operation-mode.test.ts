import { describe, expect, it } from 'vitest'
import { parseOperationMode } from './operation-mode'
import { effectiveMode } from './modo-efectivo'
import type { OperationMode } from './operation-mode'
import type { Project } from '../project/project'

const CONFIABLE = { id: 'p1', trusted: true } as Project

/** Atajo del banco: el objeto entero en cada llamada tapaba lo que se prueba. */
const modo = (mode: OperationMode, selfRepo = false): OperationMode =>
  effectiveMode({ mode, selfRepo, project: CONFIABLE, redGit: true })

describe('parseOperationMode', () => {
  it('acepta los modos validos', () => {
    expect(parseOperationMode('autonomo')).toBe('autonomo')
    expect(parseOperationMode('supervisado')).toBe('supervisado')
  })

  it('cae a supervisado ante cualquier valor desconocido', () => {
    expect(parseOperationMode(null)).toBe('supervisado')
    expect(parseOperationMode('')).toBe('supervisado')
    expect(parseOperationMode('AUTONOMO')).toBe('supervisado')
    expect(parseOperationMode('dios-modo')).toBe('supervisado')
  })
})


/**
 * ADR-089: el modo ya NO mira el texto de la peticion. Estos tests probaban lo
 * contrario —que «auth» o «autenticacion» degradaban— y ahora prueban que no,
 * porque ese freno impedia a una herramienta de seguridad arreglar seguridad.
 * La garantia es la firma humana (modo + confianza), el gate y git.
 */
describe('effectiveMode ya no juzga por palabras', () => {
  it('un hallazgo de AUTH no degrada: con confianza y red, el productor edita', () => {
    expect(modo('autonomo', false)).toBe('autonomo')
  })

  it('mantiene autonomo en trabajo rutinario, como siempre', () => {
    expect(modo('autonomo', false)).toBe('autonomo')
  })

  it('nunca escala de supervisado a autonomo', () => {
    expect(modo('supervisado', false)).toBe('supervisado')
  })

  it('pero el REPO PROPIO sigue degradando: esa garantia es estructural', () => {
    expect(modo('autonomo', true)).toBe('supervisado')
  })
})
