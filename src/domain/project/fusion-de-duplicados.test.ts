import { describe, expect, it } from 'vitest'
import { identidadFusionada, planDeFusion, type FilaAFusionar } from './fusion-de-duplicados'

const fila = (id: string, identidad: string, firstSeen: string): FilaAFusionar => ({ id, identidad, firstSeen }) // prettier-ignore

/** El caso real: tres filas de `allowed-files.ts` que son un solo defecto. */
const CORREA = 'src/domain/repair/allowed-files.ts|path-traversal|computeallowedfiles'

describe('planDeFusion: gana la que lleva mas tiempo', () => {
  it('tres filas del mismo defecto: una gana y absorbe a las otras dos', () => {
    const plan = planDeFusion([
      fila('nueva', CORREA, '2026-08-23T00:00:00Z'),
      fila('vieja', CORREA, '2026-07-01T00:00:00Z'),
      fila('media', CORREA, '2026-08-09T00:00:00Z')
    ])

    expect(plan).toHaveLength(1)
    expect(plan[0].ganadora).toBe('vieja')
    expect([...plan[0].absorbidas].sort()).toEqual(['media', 'nueva'])
  })

  it('una sola fila con esa identidad no entra en el plan: no hay que decidir', () => {
    expect(planDeFusion([fila('a', CORREA, '2026-07-01T00:00:00Z')])).toEqual([])
  })

  it('a igual fecha decide el id: dos corridas sobre los mismos datos coinciden', () => {
    const plan = planDeFusion([fila('b', CORREA, 'X'), fila('a', CORREA, 'X')])
    expect(plan[0].ganadora).toBe('a')
  })
})

describe('planDeFusion: NO colapsa de mas', () => {
  // Los cinco de `claude-cli.ts` son TRES defectos. Agrupar por fichero habria
  // fundido los cinco en uno y borrado dos problemas vivos.
  const CLI = 'src/infrastructure/claude-code/claude-cli.ts'

  it('mismo fichero y mismo tipo, distinto simbolo: siguen separados', () => {
    const plan = planDeFusion([
      fila('env1', `${CLI}|secret-in-env|buildenv`, '2026-08-21T00:00:00Z'),
      fila('argv', `${CLI}|secret-in-argv|buildargs`, '2026-08-23T00:00:00Z'),
      fila('mcp', `${CLI}|mcp-no-acotado|buildargs`, '2026-08-23T00:00:00Z')
    ])

    expect(plan).toEqual([])
  })

  it('solo se funden las que comparten los TRES campos', () => {
    const plan = planDeFusion([
      fila('env1', `${CLI}|secret-in-env|buildenv`, '2026-08-21T00:00:00Z'),
      fila('env2', `${CLI}|secret-in-env|buildenv`, '2026-08-23T00:00:00Z'),
      fila('argv', `${CLI}|secret-in-argv|buildargs`, '2026-08-23T00:00:00Z')
    ])

    expect(plan).toHaveLength(1)
    expect(plan[0].ganadora).toBe('env1')
    expect(plan[0].absorbidas).toEqual(['env2'])
  })
})

describe('el centinela retira la clave sin vaciarla', () => {
  it('no es cadena vacia: vaciarla la devolveria al PENDING de la migracion', () => {
    expect(identidadFusionada('g1', CORREA)).not.toBe('')
  })

  it('deja dicho con quien se fusiono, y ya no es la clave del ganador', () => {
    const centinela = identidadFusionada('g1', CORREA)
    expect(centinela).toContain('g1')
    expect(centinela).toContain(CORREA)
    expect(centinela).not.toBe(CORREA)
  })
})
