import { describe, expect, it } from 'vitest'
import { AREAS_DE_OBSERVACION, aArea } from './area-de-observacion'

describe('el vocabulario de areas, derivado del corpus', () => {
  it('son DOCE clases, y las dos escasas siguen dentro', () => {
    // `motor-de-reparacion` (2 obs) y `cognicion` (1) se conservan: su escasez
    // dice que los agentes aun no trabajan ahi, no que la clase no exista.
    expect(AREAS_DE_OBSERVACION).toHaveLength(12)
    expect(AREAS_DE_OBSERVACION).toContain('motor-de-reparacion')
    expect(AREAS_DE_OBSERVACION).toContain('cognicion')
  })

  it('las tres clases que cubren la mitad del corpus estan', () => {
    for (const clase of ['permisos-de-herramienta', 'consulta-del-grafo', 'indice-del-grafo']) {
      expect(AREAS_DE_OBSERVACION).toContain(clase)
    }
  })

  it('`otro` es el ultimo y existe: el cajon se declara, no se improvisa', () => {
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
