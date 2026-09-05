import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * La ausencia de deadlock entre los dos turnos NO descansa en suerte: descansa
 * en que siempre se pidan en el mismo ORDEN. Hoy el motor toma RUN y luego, solo
 * para el instante del merge, MERGE. Si algun camino los pidiera al reves —MERGE
 * y luego RUN— los dos se esperarian para siempre.
 *
 * Se fija aqui y no en un comentario porque un comentario no falla. Los caminos
 * que toman MERGE son pocos y se enumeran: si aparece uno nuevo que ademas pida
 * RUN, este test lo dice.
 */
const TOMAN_MERGE: readonly string[] = [
  'src/infrastructure/ipc/repair-sign-handler.ts',
  'src/infrastructure/ipc/push-handlers.ts'
]

const lee = (f: string): string => readFileSync(f, 'utf8')

describe('los turnos se piden siempre en el mismo orden: RUN antes que MERGE', () => {
  it.each(TOMAN_MERGE)('%s toma MERGE y NO pide RUN despues', (fichero) => {
    const fuente = lee(fichero)

    expect(fuente).toMatch(/guardMerge|tryBeginMerge/)
    expect({ fichero, pideRun: /guardRun|tryBeginRun/.test(fuente) }).toEqual({ fichero, pideRun: false }) // prettier-ignore
  })

  it('el turno del merge NO es reentrante: por eso la firma no vuelve a pedirlo', () => {
    // `conCarrilDeMerge` salta el turno en la via `firmada` justo por esto. Si
    // `tryBeginMerge` fuera reentrante, esa excepcion sobraria.
    const control = lee('src/infrastructure/run-control.ts')

    expect(control).toContain('if (merging.has(projectId)) return false')
  })
})
