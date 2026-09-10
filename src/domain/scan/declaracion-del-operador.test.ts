import { describe, expect, it } from 'vitest'
import { aDeclaracion } from './declaracion-de-modulos'
import { con, NADA } from './evidencia-fixture'
import { modulosAplicables } from './modulos-aplicables'

const modulosDe = (razones: ReadonlyArray<{ modulo: string }>): readonly string[] =>
  razones.map((r) => r.modulo)

describe('M8 y M3 no se detectan por fichero: NO CONSTA por defecto', () => {
  it('sin declaracion no estan ni entre los que aplican ni entre los descartados', () => {
    const { aplicables, descartados, sinConstancia } = modulosAplicables(con(['package.json']))

    expect(aplicables).not.toContain('M8')
    expect(modulosDe(descartados)).not.toContain('M8')
    expect(modulosDe(sinConstancia)).toContain('M8')
    expect(modulosDe(sinConstancia)).toContain('M3')
  })

  it('su razon remite a las dos vias, no afirma que no apliquen', () => {
    const m3 = modulosAplicables(NADA).sinConstancia.find((d) => d.modulo === 'M3')

    expect(m3?.razon).toContain('no consta')
    expect(m3?.razon).toContain('declaracion del operador')
  })
})

describe('quien declara sabe mejor', () => {
  it('declarar M8 lo hace aplicable aunque el detector no lo vea', () => {
    const { aplicables, sinConstancia } = modulosAplicables(NADA, { M8: true })

    expect(aplicables).toContain('M8')
    expect(modulosDe(sinConstancia)).not.toContain('M8')
  })

  it('declarar que NO aplica gana a la senal de fichero, y con su razon', () => {
    const { aplicables, descartados } = modulosAplicables(con(['src/App.tsx']), { M9: false })

    expect(aplicables).not.toContain('M9')
    expect(descartados.find((d) => d.modulo === 'M9')?.razon).toContain('declarado por el operador')
  })

  it('lo que no es del vocabulario no entra, y no arrastra lo que si', () => {
    expect(aDeclaracion('{"M8":true,"M99":true,"M3":"quiza"}')).toEqual({ M8: true })
  })

  it('una columna corrupta deja el proyecto sin declaracion, no lo tumba', () => {
    expect(aDeclaracion('{roto')).toEqual({})
    expect(aDeclaracion(null)).toEqual({})
  })
})
