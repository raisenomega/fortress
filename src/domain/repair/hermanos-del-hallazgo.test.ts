import { describe, expect, it } from 'vitest'
import { hermanosDelHallazgo, type Hermano } from './hermanos-del-hallazgo'
import type { Candidate } from './select-target'

// prettier-ignore
const T: Candidate = { id: 'f1', severity: 'MEDIUM', title: 'graph-generator spawnea sin acotar el entorno', file: 'src/infrastructure/repair/graph-generator.ts', line: 35, firstSeen: '2026-08-25T00:00:00.000Z', tipo: 'mcp-no-acotado', simbolo: 'run' }

const hermano = (id: string, file: string, tipo: string | null = 'mcp-no-acotado'): Hermano => ({
  id,
  tipo,
  file,
  line: 26,
  title: `${file} spawnea sin acotar el entorno`
})

const OTROS = [
  hermano('f2', 'src/infrastructure/repair/graph-analyst.ts'),
  hermano('f3', 'src/infrastructure/repair/graph-omega.ts')
]

describe('el analista ve las otras sedes del mismo defecto', () => {
  it('cita a los abiertos de su misma clase, con su ancla', () => {
    const linea = hermanosDelHallazgo(T, OTROS) ?? ''
    expect(linea).toContain('Otros 2 hallazgos abiertos son de esta MISMA clase (mcp-no-acotado)')
    expect(linea).toContain('src/infrastructure/repair/graph-analyst.ts:26')
    expect(linea).toContain('src/infrastructure/repair/graph-omega.ts:26')
  })

  it('y le dice que NO los arregle: la correa sale de su propia ancla', () => {
    expect(hermanosDelHallazgo(T, OTROS)).toContain('NO los')
  })

  it('no se cita a si mismo aunque comparta clase', () => {
    expect(hermanosDelHallazgo(T, [{ ...hermano('f1', T.file), id: 'f1' }])).toBeNull()
  })

  it('otra clase no es hermana: agrupar por parecido seria inventar', () => {
    expect(hermanosDelHallazgo(T, [hermano('f9', 'otro.ts', 'path-traversal')])).toBeNull()
  })

  it('sin clase (claves del formato viejo) no se dice nada', () => {
    expect(hermanosDelHallazgo({ ...T, tipo: null }, OTROS)).toBeNull()
  })

  it('con muchos, cita unos pocos y dice cuantos quedan', () => {
    const muchos = Array.from({ length: 8 }, (_, i) => hermano(`h${i}`, `f${i}.ts`))
    const linea = hermanosDelHallazgo(T, muchos) ?? ''
    expect(linea).toContain('Otros 8 hallazgos')
    expect(linea).toContain('(y 3 mas)')
    expect(linea.split('\n').filter((l) => l.startsWith('f'))).toHaveLength(5)
  })
})
