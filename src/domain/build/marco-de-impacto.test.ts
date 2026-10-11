import { describe, expect, it } from 'vitest'
import type { Finding } from '../project/finding'
import type { ImpactoDeHallazgo } from './marco-de-impacto'
import { marcoDeImpacto, moduloDe, topCriticosYAltos } from './marco-de-impacto'

/** PASO 160 (B.4): el radio de impacto de los top CRITICAL/HIGH. El dominio
 *  solo RENDERIZA el impacto ya trazado (por la app, fenced) y SELECCIONA. */

const f = (over: Partial<Finding> = {}): Finding =>
  ({
    id: 'x',
    severity: 'CRITICAL',
    title: 't',
    file: 'a.ts',
    line: 1,
    status: 'open',
    lifecycle: 'ACTIVE',
    mitigatedNote: null,
    verificacionNote: null,
    lastSeen: '2026-10-01',
    ...over
  }) as Finding

const imp = (over: Partial<ImpactoDeHallazgo> = {}): ImpactoDeHallazgo => ({
  severity: 'CRITICAL',
  file: 'src/a.ts',
  line: 10,
  title: 'secreto',
  callers: 6,
  callees: 2,
  modulos: ['src/infra/build'],
  ...over
})

describe('marcoDeImpacto: render del radio', () => {
  it('T1: muestra callers/callees y los módulos afectados', () => {
    const texto = marcoDeImpacto([imp()]).texto
    expect(texto).toContain('CRITICAL · src/a.ts:10 · secreto')
    expect(texto).toContain('6 callers')
    expect(texto).toContain('2 callees')
    expect(texto).toContain('afecta: src/infra/build')
  })

  it('sin impactos → texto vacío (la cabecera no queda huérfana)', () => {
    expect(marcoDeImpacto([]).texto).toBe('')
  })
})

describe('topCriticosYAltos: solo lo grave, acotado', () => {
  it('T4: solo CRITICAL/HIGH, tope N, orden conservado; MEDIUM/LOW y >N fuera', () => {
    const vivos = [
      f({ id: 'c1', severity: 'CRITICAL' }),
      f({ id: 'm1', severity: 'MEDIUM' }),
      f({ id: 'h1', severity: 'HIGH' }),
      f({ id: 'l1', severity: 'LOW' }),
      f({ id: 'c2', severity: 'CRITICAL' }),
      f({ id: 'h2', severity: 'HIGH' })
    ]
    const top = topCriticosYAltos(vivos, 3)
    expect(top.map((t) => t.id)).toEqual(['c1', 'h1', 'c2'])
  })
})

describe('moduloDe: qualified_name → ruta de módulo', () => {
  it('extrae src..<dir> sin el fichero ni el símbolo', () => {
    expect(moduloDe('slug.src.infrastructure.build.rebanada-del-libro.rebanadaDelLibro')).toBe(
      'src/infrastructure/build'
    )
  })
})
