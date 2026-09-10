import { describe, expect, it } from 'vitest'
import { modulosDeParada } from './modulos-de-carpeta'
import { delKit } from './plantilla-fixture'
import { buildScanPrompt } from './scan-prompt'
import { SECURITY_CHECKLIST } from './scan-checklist'

const SIN_CORPUS = { docs: [], directories: [] }
const prompt = (temas?: Parameters<typeof buildScanPrompt>[3]): string =>
  buildScanPrompt('Proyecto', SIN_CORPUS, ['src/api'], temas)

describe('sin plantillas sembradas el escaneo corre igual', () => {
  it('sin modulos, el prompt es EXACTAMENTE el de siempre', () => {
    expect(prompt()).toBe(prompt(undefined))
    expect(prompt()).toContain(SECURITY_CHECKLIST)
  })

  it('con modulos pero SIN plantillas en disco: bloque vacio, no revienta', () => {
    // El lector devolvio null para las tres, asi que no llega ninguna.
    const conModulos = prompt({ carpeta: 'src/api', plantillas: [] })

    expect(conModulos).toBe(prompt())
    expect(conModulos).toContain(SECURITY_CHECKLIST)
    expect(conModulos).not.toContain('modulos de la campana')
  })
})

describe('solo viaja lo que aplica a ESTA parada', () => {
  it('con M9 aplicable y M8 no, el prompt lleva M9 y no M8', () => {
    const soloM9 = prompt({ carpeta: 'src/ui', plantillas: [delKit('M9')] })

    expect(soloM9).toContain('M9 Accesibilidad')
    expect(soloM9).not.toContain('M8 Integridad de negocio')
  })

  it('los modulos de TEMA no bajan a la parada: son otra fase', () => {
    expect(modulosDeParada(['M2', 'M3', 'M4', 'M7', 'M9', 'M12'])).toEqual(['M3', 'M9'])
    expect(modulosDeParada(['M2', 'M7', 'M11'])).toEqual([])
  })
})

describe('el orden del prompt', () => {
  it('el bloque va DESPUES de la checklist y ANTES de las reglas', () => {
    const con = prompt({ carpeta: 'src/api', plantillas: [delKit('M8')] })

    expect(con.indexOf(SECURITY_CHECKLIST)).toBeLessThan(con.indexOf('M8 Integridad'))
    expect(con.indexOf('M8 Integridad')).toBeLessThan(con.indexOf('Reglas:'))
  })

  it('la checklist de siempre llega intacta, no la sustituye', () => {
    expect(prompt({ carpeta: 'src/api', plantillas: [delKit('M8')] })).toContain(SECURITY_CHECKLIST)
  })
})
