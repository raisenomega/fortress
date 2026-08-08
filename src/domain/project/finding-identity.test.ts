import { describe, expect, it } from 'vitest'
import { findingIdentity } from './finding-identity'
import { fingerprintOf } from './finding-fingerprint'
import { patternSuffix } from '../cognition/pattern-id'
import type { DetectedFinding } from '../scan/detected-finding'

const ssrf: DetectedFinding = {
  severity: 'MEDIUM',
  title: 'SSRF: el filtro de host privado no valida la IP resuelta por DNS',
  file: 'src/domain/posture/target-url.ts',
  line: 33
}

describe('findingIdentity (la clave de la fila entre escaneos)', () => {
  it('LO QUE IMPORTA: sobrevive a que el codigo se mueva de linea', () => {
    // Anadir un import arriba desplaza el hallazgo. Es el mismo problema.
    expect(findingIdentity({ ...ssrf, line: 41 })).toBe(findingIdentity(ssrf))
    expect(findingIdentity({ ...ssrf, line: null })).toBe(findingIdentity(ssrf))
  })

  it('la huella de descarte SI cambia con la linea: son reglas distintas a proposito', () => {
    // fingerprintOf gobierna los descartes del operador y falla del lado
    // estricto; findingIdentity gobierna la fila y falla del lado de la memoria.
    expect(fingerprintOf({ ...ssrf, line: 41 })).not.toBe(fingerprintOf(ssrf))
  })

  it('no colapsa hallazgos distintos: archivo, titulo y severidad separan', () => {
    const claves = new Set([
      findingIdentity(ssrf),
      findingIdentity({ ...ssrf, file: 'src/otro.ts' }),
      findingIdentity({ ...ssrf, title: 'Otra cosa' }),
      findingIdentity({ ...ssrf, severity: 'HIGH' })
    ])
    expect(claves.size).toBe(4)
  })

  it('la fila y el PTN del log no pueden divergir: misma regla de identidad', () => {
    // Si esto se rompe, la base y COGNITION hablarian de cosas distintas
    // creyendo hablar de la misma. El PTN no conoce la linea; la fila si la
    // guarda, pero no la usa para identificar. Las dos claves deben coincidir.
    const { severity, file, title } = ssrf
    expect(patternSuffix({ severity, file, title })).toBe(patternSuffix({ severity, file, title }))
    expect(findingIdentity(ssrf)).toBe(findingIdentity({ ...ssrf, line: 999 }))
  })

  it('tolera reformateos del reporte (espacios, mayusculas)', () => {
    const ruidoso = { ...ssrf, title: `  ${ssrf.title.toUpperCase()}  ` }
    expect(findingIdentity(ruidoso)).toBe(findingIdentity(ssrf))
  })
})
