import { describe, expect, it } from 'vitest'
import { parseScanOutput } from './parse-scan-output'

const report = (body: string): string => `Analisis.\n\n\`\`\`json\n${body}\n\`\`\``

/** Un hallazgo cuya palabra del modelo es `severity`, con lo que se le anada. */
const hallazgo = (severity: string, extra = ''): string =>
  `{"findings":[{"severity":"${severity}","title":"Precio mutable","file":"f.ts","line":1,"tipo":"otro","simbolo":"go"${extra}}]}`

const EJES_CRITICAL = ',"alcance":"anonimo","efecto":"dinero","estado":"explotable-hoy"'

describe('el parser deriva la severidad de los ejes (ADR-080)', () => {
  it('con los tres ejes la banda que manda es la derivada; la del modelo se conserva', () => {
    const r = parseScanOutput(report(hallazgo('HIGH', EJES_CRITICAL)))

    const [f] = r.ok ? r.value : []
    expect(f.severity).toBe('CRITICAL')
    expect(f.severidadDelModelo).toBe('HIGH')
    expect([f.alcance, f.efecto, f.estado]).toEqual(['anonimo', 'dinero', 'explotable-hoy'])
    expect(f.sinEjes).toBeUndefined()
  })

  it('sin ejes: la palabra del modelo manda y el hallazgo queda marcado', () => {
    const r = parseScanOutput(report(hallazgo('HIGH')))

    const [f] = r.ok ? r.value : []
    expect(f.severity).toBe('HIGH')
    expect(f.sinEjes).toBe(true)
    expect(f.severidadDelModelo).toBeUndefined()
  })

  it('un eje fuera del vocabulario: sin-ejes, y NADA sube a CRITICAL por derivar a medias', () => {
    const casi = ',"alcance":"todos","efecto":"dinero","estado":"explotable-hoy"'
    const r = parseScanOutput(report(hallazgo('LOW', casi)))

    const [f] = r.ok ? r.value : []
    expect(f.severity).toBe('LOW')
    expect(f.sinEjes).toBe(true)
    expect(f.alcance).toBeUndefined()
  })

  it('la tabla manda tambien hacia abajo: un CRITICAL del modelo con ejes de LOW queda en LOW', () => {
    const defensa = ',"alcance":"anonimo","efecto":"informacion","estado":"defensa-en-profundidad"'
    const r = parseScanOutput(report(hallazgo('CRITICAL', defensa)))

    const [f] = r.ok ? r.value : []
    expect(f.severity).toBe('LOW')
    expect(f.severidadDelModelo).toBe('CRITICAL')
  })
})
