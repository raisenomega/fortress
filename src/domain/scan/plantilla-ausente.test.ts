import { describe, expect, it } from 'vitest'
import { delKit } from './plantilla-fixture'
import { buildScanPrompt } from './scan-prompt'
import { SECURITY_CHECKLIST } from './scan-checklist'

const SIN_CORPUS = { docs: [], directories: [] }
const prompt = (temas: Parameters<typeof buildScanPrompt>[3]): string =>
  buildScanPrompt('Proyecto', SIN_CORPUS, ['src/api'], temas)

/** M8 aplica y el operador NO sembro su plantilla: el lector devolvio null. */
const SIN_SEMBRAR = { carpeta: 'src/api', modulos: ['M8'] as const, plantillas: [] }
const SEMBRADA = { carpeta: 'src/api', modulos: ['M8'] as const, plantillas: [delKit('M8')] }
const ROTA = {
  carpeta: 'src/api',
  modulos: ['M8'] as const,
  plantillas: [{ modulo: 'M8' as const, texto: '# un .md que no es del kit\n' }]
}

describe('un modulo que aplica sin su plantilla NO se calla', () => {
  it('lo dice, con el modulo y el gesto que le falta al operador', () => {
    const aviso = prompt(SIN_SEMBRAR)

    expect(aviso).toContain('Estos modulos aplican a este proyecto y NO traen su guia tematica')
    expect(aviso).toContain('M8 Integridad de negocio: su plantilla no esta sembrada en audit-kit')
  })

  it('y distingue «no la sembraste» de «la que sembraste no encaja»', () => {
    expect(prompt(ROTA)).toContain('sembrada pero no encaja con el contrato del kit')
    expect(prompt(ROTA)).not.toContain('no esta sembrada')
  })

  it('un modulo que NO aplica no se nombra: no hay ruido sobre lo que no toca', () => {
    const nada = prompt({ carpeta: 'src/api', modulos: [], plantillas: [] })

    expect(nada).not.toContain('M8')
    expect(nada).not.toContain('guia tematica')
  })

  it('con su plantilla viaja el resumen y NINGUN aviso de ausencia', () => {
    const bien = prompt(SEMBRADA)

    expect(bien).toContain('M8 Integridad de negocio — en src/api:')
    expect(bien).not.toContain('guia tematica')
  })
})

describe('declarar la ausencia nunca impide escanear', () => {
  it.each([SIN_SEMBRAR, SEMBRADA, ROTA])('sigue con la checklist base', (temas) => {
    const compuesto = prompt(temas)

    expect(compuesto).toContain(SECURITY_CHECKLIST)
    expect(compuesto).toContain('Reglas:')
  })
})
