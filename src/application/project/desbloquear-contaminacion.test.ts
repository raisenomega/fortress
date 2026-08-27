import { beforeEach, describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import type { NewOmegaEntry } from '@domain/omega/omega-entry'
import { desbloquearContaminacion } from './desbloquear-contaminacion'

const FORENSE = 'el arbol quedo sucio: sha distinto en 3 ficheros'

let marca: string | null
let limpiados: string[]
let asientos: NewOmegaEntry[]

/**
 * El doble imita la REGLA de la base y no un booleano suelto: `contaminated`
 * nace de que la marca exista, como en `project-row`. Asi, limpiar antes de leer
 * el forense dejaria el asiento sin evidencia y se veria. El SQL ya se probo.
 */
function context(): AppContext {
  const proyecto = (id: string): object | null =>
    id === 'p' ? { id, name: 'P', contaminated: marca !== null, contaminationDetail: marca } : null

  return {
    projects: {
      findById: proyecto,
      markClean: (id: string): void => {
        limpiados.push(id)
        marca = null
      }
    },
    omegaLog: { append: (entry: NewOmegaEntry): void => void asientos.push(entry) }
  } as unknown as AppContext
}

beforeEach(() => {
  marca = FORENSE
  limpiados = []
  asientos = []
})

describe('desbloquear un proyecto contaminado', () => {
  it('lo limpia una sola vez y deja constancia', () => {
    expect(desbloquearContaminacion(context(), 'p')).toEqual({ ok: true, value: null })
    expect(limpiados).toEqual(['p'])
    expect(asientos).toHaveLength(1)
  })

  it('el asiento lleva el FORENSE, no solo la palabra desbloqueado', () => {
    // Es lo unico que despues prueba QUE se autorizo, y no solo que se hizo.
    desbloquearContaminacion(context(), 'p')

    expect(asientos[0].evidence).toBe(FORENSE)
    expect(asientos[0].summary).toContain('Desbloqueo manual')
  })

  it('se asienta como nota SIN agente y sin dar nada por bueno', () => {
    // 'info', no 'ok': nadie comprobo el arbol; un humano cargo con la decision.
    desbloquearContaminacion(context(), 'p')

    expect(asientos[0]).toMatchObject({ kind: 'nota', verdict: 'info', agentId: null })
  })
})

describe('lo que no se desbloquea', () => {
  it('un proyecto que no esta bloqueado: ni se limpia ni se asienta', () => {
    marca = null

    expect(desbloquearContaminacion(context(), 'p').ok).toBe(false)
    expect(limpiados).toEqual([])
    expect(asientos).toEqual([])
  })

  it('un proyecto que ya no existe', () => {
    expect(desbloquearContaminacion(context(), 'otro').ok).toBe(false)
  })
})
