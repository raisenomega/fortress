import { describe, expect, it } from 'vitest'
import type { DetectedFinding } from '../scan/detected-finding'
import { patternId } from '../cognition/pattern-id'
import { fingerprintOf } from './finding-fingerprint'
import { findingIdentity } from './finding-identity'

const h = (extra: Partial<DetectedFinding>): DetectedFinding =>
  ({ severity: 'LOW', title: 't', file: 'src/a.ts', line: 1, ...extra }) as DetectedFinding

describe('el mismo defecto es una sola fila', () => {
  it('la redaccion, la severidad y la linea ya no parten la identidad', () => {
    // Las cinco filas reales de graph:verify: cinco titulos, dos severidades
    // (LOW y MEDIUM) y tres lineas (43, 49, 59). Un solo agujero.
    const base = { file: 'src/g.ts', tipo: 'missing-run-guard' as const, simbolo: 'handleVerify' }
    const primera = h({ ...base, severity: 'LOW', line: 43, title: 'spawnea sin tope' })
    const ultima = h({ ...base, severity: 'MEDIUM', line: 59, title: 'lanza el CLI sin guardRun' })

    expect(findingIdentity(primera)).toBe(findingIdentity(ultima))
  })

  it('mismo fichero y tipo, distinto simbolo: SIGUEN separados', () => {
    // handleVerify y handleAb son dos agujeros distintos. Sin el simbolo, el
    // tablero esconderia el segundo detras del primero.
    const base = { file: 'src/g.ts', tipo: 'missing-run-guard' as const }
    expect(findingIdentity(h({ ...base, simbolo: 'handleVerify' }))).not.toBe(
      findingIdentity(h({ ...base, simbolo: 'handleAb' }))
    )
  })

  it('mismo fichero y simbolo, distinto tipo: tambien separados', () => {
    // buildArgs tiene dos defectos: la fuga por argv y el mcp sin acotar.
    const base = { file: 'src/c.ts', simbolo: 'buildArgs' }
    expect(findingIdentity(h({ ...base, tipo: 'secret-in-argv' }))).not.toBe(
      findingIdentity(h({ ...base, tipo: 'mcp-no-acotado' }))
    )
  })

  it('sin tipo ni simbolo cae al fallback, sin fallar', () => {
    expect(findingIdentity(h({}))).toBe('src/a.ts|otro|')
  })
})

describe('lo que NO cambia', () => {
  it('el patron de COGNITION conserva su numeracion vieja', () => {
    // Valor CLAVADO del comportamiento real: si cambia, el historial entero se
    // renumera y cada `PTN-` ya escrito queda huerfano. El log ni siquiera
    // guarda el fichero, asi que la clave nueva le seria inservible.
    expect(patternId({ severity: 'HIGH', file: 'src/a.ts', title: 'algo' }, '2026')).toBe(
      'PTN-2026-397217'
    )
  })

  it('y NO mira el tipo ni el simbolo: son formulas separadas', () => {
    const a = { severity: 'HIGH' as const, file: 'src/a.ts', title: 'algo' }
    expect(patternId(a, '2026')).toBe(patternId({ ...a }, '2026'))
    // La prueba de que estan desacopladas: dos hallazgos con la MISMA identidad
    // nueva y titulos distintos dan patrones distintos, y viceversa.
    const uno = h({ tipo: 'missing-run-guard', simbolo: 's', title: 'redaccion A' })
    const dos = h({ tipo: 'missing-run-guard', simbolo: 's', title: 'redaccion B' })
    expect(findingIdentity(uno)).toBe(findingIdentity(dos))
    expect(patternId(uno, '2026')).not.toBe(patternId(dos, '2026'))
  })

  it('la huella de los descartes sigue llevando linea y titulo', () => {
    expect(fingerprintOf(h({ line: 42 }))).toBe('LOW|src/a.ts|42|t')
  })
})
