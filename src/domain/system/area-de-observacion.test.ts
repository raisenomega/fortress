import { describe, expect, it } from 'vitest'
import { AREAS_DEL_CORPUS, AREAS_DE_OBSERVACION, aArea } from './area-de-observacion'
import { AREAS_DE_FALLO } from './areas-de-fallo'
import { AREAS_DEL_TERMINAL } from './areas-del-terminal'

describe('el vocabulario de areas, derivado del corpus', () => {
  it('son DOCE clases, y las dos escasas siguen dentro', () => {
    // `motor-de-reparacion` (2 obs) y `cognicion` (1) se conservan: su escasez
    // dice que los agentes aun no trabajan ahi, no que la clase no exista.
    expect([...AREAS_DEL_CORPUS, 'otro']).toHaveLength(12)
    expect(AREAS_DE_OBSERVACION).toContain('motor-de-reparacion')
    expect(AREAS_DE_OBSERVACION).toContain('cognicion')
  })

  it('las otras familias se SUMAN sin tocarlas: son otra cosa y otra regla', () => {
    // Las doce salieron de 350 observaciones ya escritas y estan cerradas; las
    // de fallo son provisionales y se cierran del corpus que el embudo genere
    // (ADR-086); las del TERMINAL nacen de un emisor nuevo, el pre-vuelo, que
    // mira el PROYECTO y no a FORTRESS. Mezclarlas escondería esa diferencia.
    const familias = [AREAS_DEL_CORPUS, AREAS_DE_FALLO, AREAS_DEL_TERMINAL]

    expect(AREAS_DE_OBSERVACION).toHaveLength(familias.flat().length + 1)
    for (const clase of familias.flat()) expect(AREAS_DE_OBSERVACION).toContain(clase)
  })

  it('el vocabulario CRECE por clase nueva, nunca por texto libre', () => {
    // Lo que ADR-085 cerro fueron los 190 valores que escribia un modelo, no la
    // posibilidad de una clase con emisor determinista. `aArea` sigue hundiendo
    // cualquier cosa que no este declarada, que es la garantia de verdad.
    expect(aArea('barrera-del-proyecto')).toBe('barrera-del-proyecto')
    expect(aArea('barrera del proyecto')).toBe('otro')
    expect(aArea('barreras-de-proyectos')).toBe('otro')
  })

  it('las tres clases que cubren la mitad del corpus estan', () => {
    for (const clase of ['permisos-de-herramienta', 'consulta-del-grafo', 'indice-del-grafo']) {
      expect(AREAS_DE_OBSERVACION).toContain(clase)
    }
  })

  it('`otro` cierra la lista ENTERA: el cajon se declara, no se improvisa', () => {
    // Y el ultimo de todas, no el ultimo del corpus: tambien recoge un fallo
    // cuyo tipo no encaje en ninguna de las areas de rotura.
    expect(AREAS_DE_OBSERVACION.at(-1)).toBe('otro')
  })
})

describe('aArea: elegir de la lista, nunca inventar', () => {
  it('una clase del vocabulario pasa entera', () => {
    expect(aArea('permisos-de-herramienta')).toBe('permisos-de-herramienta')
  })

  it('NO traduce texto libre: las 26 formas de «permisos» caen a `otro`', () => {
    // Deliberado. Reconocer que `permisos MCP` es `permisos-de-herramienta`
    // exige juicio —el 33 % del corpus viejo casa con DOS clases a la vez— y
    // adivinar aqui clasificaria mal una de cada tres. Las 350 viejas esperan
    // su backfill, que es otro gesto y necesita un agente.
    for (const suelto of ['permisos MCP', 'permisos-mcp', 'sandbox de Bash', 'permisos / MCP']) {
      expect(aArea(suelto)).toBe('otro')
    }
  })

  it('y lo que no es ni texto cae igual, sin lanzar', () => {
    expect(aArea(undefined)).toBe('otro')
    expect(aArea(7)).toBe('otro')
    expect(aArea(null)).toBe('otro')
  })
})
