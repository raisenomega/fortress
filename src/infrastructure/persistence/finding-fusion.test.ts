import { beforeEach, describe, expect, it } from 'vitest'
import { createBench, PROJECT, type Bench } from './finding-fixture'
import { conLasTresFilas, memoria, reclasificarYFusionar } from './finding-fusion-fixture'

let bench: Bench

beforeEach(() => {
  bench = createBench()
  conLasTresFilas(bench)
})

describe('el colapso: dos filas eran una', () => {
  it('antes de fusionar hay TRES filas del mismo defecto: eso es el defecto', () => {
    expect(bench.rows()).toBe(3)
  })

  it('gana la mas antigua y las otras dos quedan absorbidas', () => {
    expect(reclasificarYFusionar(bench)).toBe(2)

    const vivas = bench.repo.listMemory(PROJECT).filter((f) => f.lifecycle !== 'EXTINCT')
    expect(vivas).toHaveLength(1)
    expect(vivas[0].id).toBe('vieja')
    // Las tres filas siguen ahi: se marcan, no se borran. 102 de las 106
    // propuestas apuntan a filas de este universo, dos de ellas ya MERGEADAS.
    expect(bench.rows()).toBe(3)
  })

  it('la ganadora conserva su first_seen y absorbe tipo y simbolo', () => {
    reclasificarYFusionar(bench)

    expect(memoria(bench, 'vieja').first_seen).toBe('2026-07-01T00:00:00Z')
    expect(memoria(bench, 'vieja').tipo).toBe('path-traversal')
    expect(memoria(bench, 'vieja').simbolo).toBe('computeAllowedFiles')
  })

  it('la absorbida dice de quien, y NO dice que se resolviera', () => {
    reclasificarYFusionar(bench)

    expect(memoria(bench, 'media').lifecycle).toBe('EXTINCT')
    expect(memoria(bench, 'media').extinct_reason).toBe('fusionada-con-vieja')
    expect(memoria(bench, 'media').resolved_at).toBeNull()
  })
})

describe('fundir no puede bajar la gravedad', () => {
  it('la superviviente MEDIUM se queda con el HIGH que absorbe', () => {
    // El caso REAL del 24 de agosto: la mas antigua era MEDIUM y absorbio el
    // HIGH de la correa de alcance, que desaparecio del tablero. Hoy sube.
    expect(memoria(bench, 'vieja').severity).toBe('MEDIUM')

    reclasificarYFusionar(bench)

    expect(memoria(bench, 'vieja').severity).toBe('HIGH')
    // Y sigue ganando ELLA: la severidad sube, el desempate no cambia (ADR-071).
    expect(memoria(bench, 'vieja').first_seen).toBe('2026-07-01T00:00:00Z')
  })

  it('con el grupo homogeneo nadie toca la severidad', () => {
    const soloMedium = createBench()
    conLasTresFilas(soloMedium)
    soloMedium.db.prepare(`UPDATE findings SET severity = 'MEDIUM'`).run()

    reclasificarYFusionar(soloMedium)

    expect(memoria(soloMedium, 'vieja').severity).toBe('MEDIUM')
  })
})
