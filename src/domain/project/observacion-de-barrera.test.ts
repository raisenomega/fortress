import { describe, expect, it } from 'vitest'
import { AREAS_DE_OBSERVACION, aArea } from '../system/area-de-observacion'
import { ROTA } from './hook-fixture'
import { observacionDeBarrera, observacionesDeBarreras } from './observacion-de-barrera'

describe('la barrera rota se convierte en observacion', () => {
  it('con su area NUEVA, que esta en el vocabulario cerrado', () => {
    expect(observacionDeBarrera(ROTA).area).toBe('barrera-del-proyecto')
    expect(AREAS_DE_OBSERVACION).toContain('barrera-del-proyecto')
    // Y no cae al cajon: si no estuviera en el vocabulario, `aArea` la hundiria.
    expect(aArea('barrera-del-proyecto')).toBe('barrera-del-proyecto')
  })

  it('es un BUG, no una limitacion: algo roto, no un techo de FORTRESS', () => {
    expect(observacionDeBarrera(ROTA).kind).toBe('bug')
  })

  it('con DATOS DUROS: que hook, que interprete falta y cual usar', () => {
    const { note } = observacionDeBarrera(ROTA)

    expect(note).toContain('Write|Edit|MultiEdit')
    expect(note).toContain('protect-invariants.py')
    expect(note).toContain('python')
    expect(note).toContain('python3')
  })

  it('sin alternativa lo DICE, en vez de callarlo', () => {
    expect(observacionDeBarrera({ ...ROTA, alternativa: null }).note).toContain('ningun interprete') // prettier-ignore
  })

  it('el agente NO pone el proyecto: el draft solo trae kind, area y note', () => {
    // `sourceProject` y `projectPath` los pone quien asienta (`asentarNotas`):
    // un agente no sabe en que proyecto lo lanzaron, y el path alimenta al cerco.
    expect(Object.keys(observacionDeBarrera(ROTA)).sort()).toEqual(['area', 'kind', 'note'])
  })
})

describe('las de un proyecto', () => {
  it('una nota por barrera', () => {
    expect(observacionesDeBarreras([ROTA, ROTA])).toHaveLength(2)
    expect(observacionesDeBarreras([])).toEqual([])
  })

  it('y la nota es DETERMINISTA — aunque pase el tiempo entre las dos', () => {
    // Comparar dos llamadas seguidas no probaba nada: `Date.now()` devuelve lo
    // mismo dentro del mismo milisegundo, y el test pasaba con la nota bailando.
    // Determinista => el UNIQUE de `observation_sightings` absorbe la repeticion
    // del pre-vuelo turno tras turno, en vez de sembrar una fila por envio.
    const primera = observacionDeBarrera(ROTA)
    const inicio = Date.now()
    while (Date.now() === inicio) expect(inicio).toBeGreaterThan(0)

    expect(observacionDeBarrera(ROTA)).toEqual(primera)
  })
})
