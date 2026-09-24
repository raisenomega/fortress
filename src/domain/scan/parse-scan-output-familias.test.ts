import { describe, expect, it } from 'vitest'
import type { DetectedFinding } from './detected-finding'
import { parseScanOutput } from './parse-scan-output'
import { DEFECTOS_DE_AUDITORIA } from './defectos-de-auditoria'

const report = (body: string): string => `Analisis.\n\n\`\`\`json\n${body}\n\`\`\``
const hallazgo = (severity: string, tipo: string, extra = ''): string =>
  `{"findings":[{"severity":"${severity}","title":"Contraste 4.08:1","file":"theme.css","line":23,"tipo":"${tipo}","simbolo":""${extra}}]}`
const EJES_HIGH = ',"alcance":"anonimo","efecto":"disponibilidad","estado":"explotable-hoy"'
const primero = (body: string): DetectedFinding | undefined => {
  const r = parseScanOutput(report(body))
  return r.ok ? r.value[0] : undefined
}

describe('las familias de auditoria no pasan por la tabla de seguridad (ADR-103 §2)', () => {
  it.each(Object.keys(DEFECTOS_DE_AUDITORIA))(
    '%s: manda la palabra del modelo aunque vengan ejes',
    (tipo) => {
      const f = primero(hallazgo('LOW', tipo, EJES_HIGH))
      expect(f?.severity).toBe('LOW')
      expect(f?.ejesNoAplican).toBe(true)
      expect(f?.sinEjes).toBeUndefined()
      expect(f?.severidadDelModelo).toBeUndefined()
      expect([f?.alcance, f?.efecto, f?.estado]).toEqual([undefined, undefined, undefined])
    }
  )

  it('ejesNoAplican no es sinEjes: sin ejes tampoco se marca sinEjes en una familia', () => {
    const f = primero(hallazgo('MEDIUM', 'privacidad'))
    expect(f?.severity).toBe('MEDIUM')
    expect(f?.ejesNoAplican).toBe(true)
    expect(f?.sinEjes).toBeUndefined()
  })

  it('seguridad sigue por la tabla, sin cambio: los mismos ejes derivan HIGH', () => {
    const f = primero(hallazgo('LOW', 'cors-permisivo', EJES_HIGH))
    expect(f?.severity).toBe('HIGH')
    expect(f?.severidadDelModelo).toBe('LOW')
    expect(f?.ejesNoAplican).toBeUndefined()
  })

  it('otro sigue por la tabla, y sin ejes queda sinEjes como hoy', () => {
    expect(primero(hallazgo('LOW', 'otro', EJES_HIGH))?.severity).toBe('HIGH')
    const sin = primero(hallazgo('LOW', 'otro'))
    expect(sin?.sinEjes).toBe(true)
    expect(sin?.ejesNoAplican).toBeUndefined()
  })
})
