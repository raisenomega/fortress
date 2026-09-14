import { useMemo } from 'react'
import type { Finding } from '@domain/project/finding'
import { filtrarElTablero, type FiltroDelTablero } from '@domain/project/filtro-del-tablero'
import { recuentoDelTablero, type RecuentoDelTablero } from '@domain/project/recuento-del-tablero'
import { useProjectFindings } from '../stores/scan-selectors'
import { SIN_SELECCION, useTableroStore } from '../stores/tablero-store'

export interface Tablero {
  readonly filtro: FiltroDelTablero
  /** Lo que la tabla pinta con los dos chips puestos. */
  readonly visibles: readonly Finding[]
  /** Los numeros de los chips, cruzados: cada eje cuenta sobre lo que el otro deja. */
  readonly recuento: RecuentoDelTablero
  readonly seleccion: ReadonlySet<string>
  /** De los seleccionados, cuantos estan en la vista de ahora. El contador
   *  honesto de la barra: la seleccion persiste al cambiar de chip, asi que sin
   *  este numero se podria verificar a ciegas algo que no se esta viendo. */
  readonly visiblesSeleccionados: number
}

/**
 * Todo lo que el tablero necesita para pintarse, en un sitio.
 *
 * EL FILTRADO VA EN UN `useMemo`, NO EN EL SELECTOR DE ZUSTAND, y no es
 * preferencia: un selector que devuelve `array.filter(...)` crea una referencia
 * nueva en cada comparacion, zustand lo ve como estado distinto y React entra en
 * bucle. Es la misma trampa por la que `scan-selectors` tiene su `NO_FINDINGS`
 * constante. Aqui se leen las piezas —que si son estables— y se compone fuera.
 */
export function useTablero(projectId: string | null): Tablero {
  const findings = useProjectFindings(projectId)
  const severidad = useTableroStore((s) => (projectId ? s.severidad[projectId] : undefined))
  const estado = useTableroStore((s) => (projectId ? s.estado[projectId] : undefined))
  const seleccion = useTableroStore((s) =>
    projectId ? (s.seleccion[projectId] ?? SIN_SELECCION) : SIN_SELECCION
  )

  const filtro: FiltroDelTablero = useMemo(
    () => ({ severidad: severidad ?? 'ALL', estado: estado ?? 'ALL' }),
    [severidad, estado]
  )

  return useMemo(() => {
    const visibles = filtrarElTablero(findings, filtro)
    return {
      filtro,
      visibles,
      recuento: recuentoDelTablero(findings, filtro),
      seleccion,
      visiblesSeleccionados: visibles.filter((f) => seleccion.has(f.id)).length
    }
  }, [findings, filtro, seleccion])
}
