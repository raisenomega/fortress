import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { supervivientesDegradadas } from '@domain/project/severidad-al-fundir'
import { masUrgente } from '@domain/shared/severity'
import { temporal } from './base-temporal-fixture'
import { createBench, PROJECT, type Bench } from './finding-fixture'
import { repararGravedad } from './reparar-gravedad'
import { puedeAplicar } from './reparar-gravedad-guardas'
import { dosVictimas, filaDe } from './reparar-gravedad-fixture'

let bench: Bench
const victimas = (p: Parameters<typeof supervivientesDegradadas>[0]): ReturnType<typeof supervivientesDegradadas> => supervivientesDegradadas(p, masUrgente) // prettier-ignore
const fila = (id: string): Record<string, unknown> => filaDe(bench, id)

beforeEach(() => {
  bench = createBench()
  dosVictimas(bench)
})

/**
 * Las guardas del modo APLICAR, con la app simulada. No hay forma de probar el
 * `pgrep` de verdad, pero si de probar que su respuesta MANDA — y que manda
 * aunque el backup sea perfecto.
 */
describe('sin las dos guardas, no se escribe', () => {
  const tmp = temporal()
  afterEach(() => tmp.limpiar())

  const backupBueno = (): string =>
    tmp.conFindings('copia.db', ['correa', 'correa-abs', 'argv', 'argv-abs'])

  it('con la app ABIERTA aborta, aunque el backup sea valido', () => {
    expect(() =>
      repararGravedad(bench.db, PROJECT, victimas, (v, n) =>
        puedeAplicar(v, n, backupBueno(), () => false)
      )
    ).toThrow('la app esta ABIERTA')

    expect(fila('correa').severity).toBe('MEDIUM')
  })

  it('con un backup de mentira aborta, aunque la app este cerrada', () => {
    expect(() =>
      repararGravedad(bench.db, PROJECT, victimas, (v, n) =>
        puedeAplicar(v, n, tmp.vacia('placebo.db'), () => true)
      )
    ).toThrow('no tiene tabla findings')

    expect(fila('correa').severity).toBe('MEDIUM')
  })

  it('con las dos en su sitio, escribe', () => {
    repararGravedad(bench.db, PROJECT, victimas, (v, n) =>
      puedeAplicar(v, n, backupBueno(), () => true)
    )

    expect(fila('correa').severity).toBe('HIGH')
  })
})
