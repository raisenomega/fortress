import { planDeFusion, type FilaAFusionar, type Fusion } from './fusion-de-duplicados'
import type { Veredicto } from './veredicto-del-lote-tipos'

/**
 * Lo que quedaria REPETIDO despues del paso B: las vivas de hoy mas las
 * juzgadas que siguen vivas con su identidad nueva.
 *
 * Tres zombis de mailbd (`public/_headers:6`) describian el mismo defecto con
 * tres titulos: con la clave vieja —severidad│fichero│titulo— eran tres filas;
 * con la de hoy —fichero│linea│tipo— son una, y el criterio 3 de la red paro el
 * ensayo del 2026-09-22 justo por eso. Es el caso que ADR-071 resuelve, y se
 * resuelve igual que en el paso A: la mas antigua sobrevive.
 *
 * Una extinguida no compite: ya no esta viva, y una muerta no repite clave con
 * nadie. Una `sin_decidir` tampoco: no se le escribe identidad. La antiguedad
 * viene aparte porque el veredicto no la lleva —decidir el juicio no la
 * necesita— y sin ella no hay plan: faltar es un fallo de cableado, no un dato.
 */
export function fusionesDelPasoB(
  vivas: readonly FilaAFusionar[],
  veredictos: readonly Veredicto[],
  firstSeen: ReadonlyMap<string, string>
): readonly Fusion[] {
  const juzgadas = veredictos.flatMap((v): FilaAFusionar[] => {
    if (v.desenlace !== 'real' && v.desenlace !== 'sin_prueba') return []
    const visto = firstSeen.get(v.id)
    if (visto === undefined) throw new Error(`juzgada sin first_seen: ${v.id}`)
    return [{ id: v.id, identidad: v.identidad_nueva, firstSeen: visto }]
  })
  return planDeFusion([...vivas, ...juzgadas])
}
