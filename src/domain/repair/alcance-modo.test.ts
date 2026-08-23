import { describe, expect, it } from 'vitest'
import type { ConfigState } from './auto-merge-config'
import { DEFAULT_POLICY } from './auto-merge-policy'
import { dentroDelAlcance, puedeAutoIntegrarse, puedeTrabajarse } from './alcance'

/** El cerco real de este repo: solo LOW, y con `ipc/**` excluido. */
const CERCO: ConfigState = {
  kind: 'valid',
  policy: {
    ...DEFAULT_POLICY, enabled: true, severities: ['LOW'],
    blacklist: ['src/infrastructure/ipc/**', 'docs/**']
  } // prettier-ignore
}

const LIBRE = 'src/infrastructure/claude-code/run-accumulator.ts'
const VETADO = 'src/infrastructure/ipc/graph-action-handlers.ts'

const DEFENSA = 'src/infrastructure/run-guard.ts'
const POSTURA = 'src/domain/posture/private-host.ts'

describe('si el motor puede TRABAJAR el hallazgo, que es otra pregunta', () => {
  it('un MEDIUM fuera de las defensas si se trabaja: nadie lo va a integrar solo', () => {
    // El cerco lo denegaria, y da igual: la vuelta para antes del merge.
    expect(puedeAutoIntegrarse('MEDIUM', LIBRE, CERCO)).toBe(false)
    expect(puedeTrabajarse(LIBRE)).toBe(true)
  })

  it('un fichero de la lista innegociable NO se trabaja, sea cual sea su severidad', () => {
    expect(puedeTrabajarse(DEFENSA)).toBe(false)
  })

  it('la carpeta de postura tambien esta cerrada, por su glob', () => {
    expect(puedeTrabajarse(POSTURA)).toBe(false)
  })

  it('estar en la blacklist del PROYECTO no impide trabajarlo, solo integrarlo', () => {
    // `ipc/**` lo pone el proyecto en su config; no es una defensa del motor.
    expect(puedeTrabajarse(VETADO)).toBe(true)
    expect(puedeAutoIntegrarse('LOW', VETADO, CERCO)).toBe(false)
  })
})

describe('el alcance sale del modo, no de un ajuste', () => {
  it('la vuelta que puede integrar sola usa el filtro estrecho', () => {
    expect(dentroDelAlcance('completo', 'MEDIUM', LIBRE, CERCO)).toBe(false)
  })

  it('las que paran antes del merge usan el ancho', () => {
    // Que la vuelta no pueda llegar al repo es lo que hace seguro el ancho.
    expect(dentroDelAlcance('hasta-omega', 'MEDIUM', LIBRE, CERCO)).toBe(true)
    expect(dentroDelAlcance('hasta-gate', 'MEDIUM', LIBRE, CERCO)).toBe(true)
  })

  it('ningun modo alcanza las defensas del motor', () => {
    for (const modo of ['completo', 'hasta-gate', 'hasta-omega'] as const) {
      expect(dentroDelAlcance(modo, 'LOW', DEFENSA, CERCO)).toBe(false)
    }
  })
})
