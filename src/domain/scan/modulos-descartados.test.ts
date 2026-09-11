import { describe, expect, it } from 'vitest'
import { con, NADA } from './evidencia-fixture'
import { MODULOS_AUDITORIA } from './modulo-auditoria'
import { MODULOS_SIEMPRE } from './modulos-siempre'
import { modulosAplicables, type VeredictoDeModulos } from './modulos-aplicables'

/** Donde acabo cada modulo. Un modulo en dos cajas —o en ninguna— sale aqui. */
const cajasDe = (v: VeredictoDeModulos, modulo: string): readonly string[] =>
  [
    v.aplicables.includes(modulo as never) ? 'aplicables' : null,
    v.descartados.some((d) => d.modulo === modulo) ? 'descartados' : null,
    v.sinConstancia.some((d) => d.modulo === modulo) ? 'sinConstancia' : null
  ].filter((c): c is string => c !== null)

describe('lo que NO aplica se declara, no se calla (ADR-083, decision 4)', () => {
  it('un proyecto sin UI descarta M9 diciendo QUE se busco', () => {
    const { descartados } = modulosAplicables(con(['package.json']))
    const m9 = descartados.find((d) => d.modulo === 'M9')

    expect(m9?.razon).toBe('M9 Accesibilidad: no aplica, no hay .tsx, .jsx, .vue, .svelte')
  })

  it.each(MODULOS_AUDITORIA)('%s tiene veredicto: nada se recorta', (modulo) => {
    // `detectStack` se queda con tres etiquetas; aqui salen los DOCE. Un modulo
    // que se cae por el camino es indistinguible de uno que se olvido.
    expect(cajasDe(modulosAplicables(con(['package.json', 'src/App.tsx'])), modulo)).toHaveLength(1)
  })

  it.each(MODULOS_AUDITORIA)('%s aplica, o trae su razon: nunca las dos ni ninguna', (modulo) => {
    const veredicto = modulosAplicables(NADA)
    const fuera = [...veredicto.descartados, ...veredicto.sinConstancia]
    const razon = fuera.find((d) => d.modulo === modulo)?.razon ?? ''

    if (veredicto.aplicables.includes(modulo)) {
      expect({ modulo, siempre: MODULOS_SIEMPRE.includes(modulo) }).toEqual({
        modulo,
        siempre: true
      })
      return
    }
    expect(razon.startsWith(`${modulo} `) && razon.length > modulo.length + 12).toBe(true)
  })

  it('un proyecto VACIO solo aplica el nucleo, y de los otros nueve da razon', () => {
    const { aplicables, descartados, sinConstancia } = modulosAplicables(NADA)

    expect(aplicables).toEqual(MODULOS_SIEMPRE)
    expect(aplicables.length + descartados.length + sinConstancia.length).toBe(
      MODULOS_AUDITORIA.length
    )
  })
})
