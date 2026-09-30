import { describe, expect, it } from 'vitest'
import { cubierto, fuente, todos } from './innegociables-fixture'
import { puedeTrabajarse } from './alcance'

/**
 * ADR-106 §3.4 — la puerta de SELECCION, blindada justo cuando se sube.
 *
 * Medido el 2026-09-30, antes de decidirlo: la puerta de INTEGRACION ya estaba
 * protegida (`alcance`, `scope-check`, `firma-limite`, el par de auto-merge) y la
 * de SELECCION no lo estaba —ni `debut`, ni `select-target`, ni el orden, ni
 * quien elige—. Abrir HIGH deja HIGH trabajables en el repo propio (12 al
 * firmar; 7 abiertos y activos tras ADR-107), y una defensa que dependa de que
 * nadie proponga tocarla no sobrevive a un lote.
 */
const SELECCION = [
  'src/domain/repair/debut.ts',
  'src/domain/repair/select-target.ts',
  'src/domain/repair/orden-candidatos.ts',
  'src/application/repair/elegir-objetivo.ts'
]

/** Se deriva de lo que el fichero DEFINE: si la puerta se muda, la siguen. */
const PUERTA =
  /export (?:const DEBUT|function isDebutEligible|function selectTarget|function candidates|function cargaPorDirectorio)\b/

describe('la puerta de la seleccion es innegociable (ADR-106)', () => {
  it.each(SELECCION)('%s esta en la lista', (fichero) => {
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })

  it('y el motor no puede proponer un fix ahi, en NINGUN modo', () => {
    for (const f of SELECCION) expect(puedeTrabajarse(f)).toBe(false)
  })

  it('quien DEFINE la puerta queda cubierto, aunque el fichero se mude', () => {
    const define = todos.filter((f) => PUERTA.test(fuente(f)))

    expect(define.length).toBeGreaterThanOrEqual(4)
    for (const f of define) expect({ f, protegido: cubierto(f) }).toEqual({ f, protegido: true })
  })
})
