import { describe, expect, it } from 'vitest'
import { promptDeReclasificacion, type ItemAReclasificar } from './prompt-de-reclasificacion'
import { DEFECTOS } from './tipo-de-defecto'

const item: ItemAReclasificar = {
  id: 'z1', file: 'supabase/functions/x/index.ts', line: 364, title: 'permite reenviar correos', severity: 'MEDIUM',
  candidata: { id: 'g1', line: 364, tipo: 'relay-abierto', title: 'Relay de correo abierto' }
} // prettier-ignore

/**
 * ADR-081 (c): el backfill no puede correr antes que la regla de eleccion. El
 * prompt de la Fase B mandaba 27 slugs desnudos, y elegir por el nombre es lo
 * que ADR-081 vino a quitar. Aqui se fija que viajen las DEFINICIONES y los
 * desempates: el mismo bloque que lee el escaner, no una copia.
 */
describe('el prompt de reclasificacion manda la regla de eleccion entera', () => {
  const texto = promptDeReclasificacion([item])

  it('lleva cada tipo CON su definicion, no solo el nombre', () => {
    expect(texto).toContain(`path-traversal: ${DEFECTOS['path-traversal']}`)
    expect(texto).toContain(`relay-abierto: ${DEFECTOS['relay-abierto']}`)
  })

  it('lleva los desempates y la regla del simbolo del contrato', () => {
    expect(texto).toContain('desempata asi')
    expect(texto).toContain('- simbolo:')
  })

  it('le presenta la candidata a gemela y le pide decidir si es el MISMO defecto', () => {
    expect(texto).toContain('"gemela"')
    expect(texto).toContain('g1')
    expect(texto).toContain('relay-abierto')
  })

  it('pide SOLO tipo, simbolo y gemela: ni titulo ni severidad', () => {
    expect(texto).toContain('NO cambies el titulo ni la severidad')
  })
})
