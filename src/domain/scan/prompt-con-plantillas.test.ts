import { describe, expect, it } from 'vitest'
import { modulosDeParada } from './modulos-de-carpeta'
import { delKit } from './plantilla-fixture'
import { buildScanPrompt } from './scan-prompt'
import { SECURITY_CHECKLIST } from './scan-checklist'

const SIN_CORPUS = { docs: [], directories: [] }
const prompt = (temas?: Parameters<typeof buildScanPrompt>[3]): string =>
  buildScanPrompt('Proyecto', SIN_CORPUS, ['src/api'], temas)

describe('sin modulos que apliquen, el prompt es el de siempre', () => {
  it('nada que decir: ni bloque ni aviso', () => {
    const pelado = prompt({ carpeta: 'src/api', modulos: [], plantillas: [] })

    expect(pelado).toBe(prompt())
    expect(pelado).toContain(SECURITY_CHECKLIST)
    expect(pelado).not.toContain('modulos de la campana')
  })
})

describe('solo viaja lo que aplica a ESTA parada', () => {
  it('con M9 aplicable y M8 no, el prompt lleva M9 y no menciona M8', () => {
    const soloM9 = prompt({ carpeta: 'src/ui', modulos: ['M9'], plantillas: [delKit('M9')] })

    expect(soloM9).toContain('M9 Accesibilidad')
    expect(soloM9).not.toContain('M8')
  })

  it('los modulos de TEMA no bajan a la parada: son otra fase', () => {
    expect(modulosDeParada(['M2', 'M3', 'M4', 'M7', 'M9', 'M12'])).toEqual(['M3', 'M9'])
    expect(modulosDeParada(['M2', 'M7', 'M11'])).toEqual([])
  })
})

describe('el orden del prompt', () => {
  const con = prompt({ carpeta: 'src/api', modulos: ['M8'], plantillas: [delKit('M8')] })

  it('el bloque va DESPUES de la checklist y ANTES de las reglas', () => {
    expect(con.indexOf(SECURITY_CHECKLIST)).toBeLessThan(con.indexOf('M8 Integridad'))
    expect(con.indexOf('M8 Integridad')).toBeLessThan(con.indexOf('Reglas:'))
  })

  it('la checklist de siempre llega intacta, no la sustituye', () => {
    expect(con).toContain(SECURITY_CHECKLIST)
  })
})
