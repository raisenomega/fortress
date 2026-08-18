import { describe, expect, it } from 'vitest'
import type { AppContext } from '../context'
import { spentToday, spentTodayByProject } from './read-budget'

/** Dos proyectos gastando el mismo dia: lo que separa un tope del otro. */
const context = (porProyecto: Record<string, number>): AppContext =>
  ({
    runs: {
      usageSince: () => ({
        costUsd: Object.values(porProyecto).reduce((suma, usd) => suma + usd, 0)
      }),
      usageByProjectSince: () =>
        Object.fromEntries(Object.entries(porProyecto).map(([id, costUsd]) => [id, { costUsd }]))
    }
  }) as unknown as AppContext

const AHORA = new Date('2026-08-18T15:00:00.000Z')

describe('el gasto del dia, entero y por proyecto', () => {
  it('el tope de sesion solo ve lo gastado en SU proyecto', () => {
    const ctx = context({ mailbd: 4, otro: 20 })

    expect(spentTodayByProject(ctx, AHORA, 'mailbd')).toBe(4)
  })

  it('el tope diario sigue viendolo TODO: es el techo del operador', () => {
    // No-regresion: si esto cambiara, chatear en otro proyecto dejaria de
    // contar contra el limite diario y el freno global se volveria ciego.
    expect(spentToday(context({ mailbd: 4, otro: 20 }), AHORA)).toBe(24)
  })

  it('un proyecto que aun no gasto nada hoy lleva cero, no un hueco', () => {
    expect(spentTodayByProject(context({ otro: 20 }), AHORA, 'mailbd')).toBe(0)
  })

  it('sin ninguna ejecucion en el dia, los dos leen cero', () => {
    const vacio = context({})

    expect(spentTodayByProject(vacio, AHORA, 'mailbd')).toBe(0)
    expect(spentToday(vacio, AHORA)).toBe(0)
  })
})
