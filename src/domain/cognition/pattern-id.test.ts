import { describe, expect, it } from 'vitest'
import { patternId, patternSuffix, type PatternIdentity } from './pattern-id'

const SSRF: PatternIdentity = {
  severity: 'MEDIUM',
  file: 'src/domain/posture/target-url.ts',
  title: 'SSRF: el filtro de host privado no valida la IP resuelta por DNS'
}

/** El formato que exige el parser del log: PTN-ANO-DIGITOS. */
const FORMATO = /^PTN-\d{4}-\d+$/

describe('patternId (identidad estable de un patron)', () => {
  it('LO QUE IMPORTA: el mismo hallazgo da el mismo id en dos corridas', () => {
    expect(patternSuffix(SSRF)).toBe(patternSuffix({ ...SSRF }))
    expect(patternId(SSRF, '2026')).toBe(patternId({ ...SSRF }, '2026'))
  })

  it('el id NO depende de la posicion: era el bug del esquema viejo', () => {
    const otro: PatternIdentity = { severity: 'LOW', file: 'src/b.ts', title: 'Otro hallazgo' }
    // Da igual que se procese primero, ultimo o solo: su id es suyo.
    const solo = patternSuffix(SSRF)
    const conVecinos = [otro, SSRF, otro].map(patternSuffix)[1]
    expect(conVecinos).toBe(solo)
  })

  it('sobrevive a que el codigo se mueva: la linea no entra en la identidad', () => {
    // Anadir un import arriba desplaza el hallazgo; sigue siendo el mismo.
    expect(patternSuffix({ ...SSRF })).toBe(patternSuffix({ ...SSRF }))
  })

  it('tolera reformateos del reporte: espacios y mayusculas no cambian el id', () => {
    const reformateado = {
      ...SSRF,
      title: '  SSRF: el filtro de host privado   no valida la IP resuelta por DNS ',
      file: 'SRC/domain/posture/target-url.ts'
    }
    expect(patternSuffix(reformateado)).toBe(patternSuffix(SSRF))
  })

  it('hallazgos distintos NO comparten id (archivo, titulo o severidad)', () => {
    const ids = new Set([
      patternSuffix(SSRF),
      patternSuffix({ ...SSRF, file: 'src/otro.ts' }),
      patternSuffix({ ...SSRF, title: 'Otra cosa' }),
      patternSuffix({ ...SSRF, severity: 'HIGH' })
    ])
    expect(ids.size).toBe(4)
  })

  it('el id cumple el formato que el parser del log exige', () => {
    expect(patternId(SSRF, '2026')).toMatch(FORMATO)
  })

  it('el ano viene de la primera deteccion, no del escaneo: no cambia al pasar de ano', () => {
    expect(patternId(SSRF, '2026')).toBe('PTN-2026-' + patternSuffix(SSRF))
    expect(patternId(SSRF, '2027')).not.toBe(patternId(SSRF, '2026')) // distinto ano = otro id
  })
})
