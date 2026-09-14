import { useState } from 'react'
// prettier-ignore
import type { FiltroDeEstado, FiltroDeSeveridad } from '@domain/project/filtro-del-tablero'
import { verificable } from '@domain/project/verificable'
import { verificarSeleccionadas } from '../services/verificacion-masiva-service'
import { useTableroStore } from '../stores/tablero-store'
import { useVerificacionMasivaStore } from '../stores/verificacion-masiva-store'
import type { Tablero } from './useTablero'

export interface SeleccionDelTablero {
  readonly verificando: boolean
  /** El dialogo esta abierto: el gasto todavia no se ha autorizado. */
  readonly preguntando: boolean
  /** Los verificables que hay ahora mismo en la vista. El atajo de la cabecera. */
  readonly visibles: readonly string[]
  readonly elegirSeveridad: (valor: FiltroDeSeveridad) => void
  readonly elegirEstado: (valor: FiltroDeEstado) => void
  readonly alternar: (findingId: string) => void
  readonly alternarVisibles: () => void
  readonly limpiar: () => void
  readonly preguntar: () => void
  readonly cerrar: () => void
  readonly confirmar: () => void
}

/**
 * Los gestos del tablero atados a su proyecto, fuera del componente.
 *
 * Cambiar de chip NO toca la seleccion: elegir cinco, saltar a otro chip para
 * mirar algo y volver es como se trabaja, y perderlos por el camino castigaria
 * justo eso. Lo que impide verificar a ciegas no es vaciarla, es que la barra
 * diga cuantos de los elegidos estan delante.
 *
 * Verificar NO gasta al pulsar: abre el dialogo. Es la misma puerta que el boton
 * de la cabecera, y tiene que serlo — sin techo de gasto, una puerta que no
 * pregunta seria la unica sin barrera, y seria la de un clic sobre una fila.
 *
 * Las acciones se leen con SELECTORES FINOS y no con `useTableroStore()` entero:
 * aquello se suscribe a todo el store y cualquier cambio de filtro repintaba las
 * quinientas filas. Es la trampa de `NO_FINDINGS` con otra cara.
 */
export function useSeleccionDelTablero(projectId: string, tablero: Tablero): SeleccionDelTablero {
  const [preguntando, setPreguntando] = useState(false)
  const setSeveridad = useTableroStore((s) => s.setSeveridad)
  const setEstado = useTableroStore((s) => s.setEstado)
  const alternarUno = useTableroStore((s) => s.alternar)
  const alternarTodas = useTableroStore((s) => s.alternarVisibles)
  const limpiarSel = useTableroStore((s) => s.limpiar)
  const verificando = useVerificacionMasivaStore((s) => s.projectId !== null)
  const visibles = tablero.visibles.filter(verificable).map((f) => f.id)

  return {
    verificando,
    preguntando,
    visibles,
    elegirSeveridad: (valor) => setSeveridad(projectId, valor),
    elegirEstado: (valor) => setEstado(projectId, valor),
    alternar: (findingId) => alternarUno(projectId, findingId),
    alternarVisibles: () => alternarTodas(projectId, visibles),
    limpiar: () => limpiarSel(projectId),
    preguntar: () => setPreguntando(true),
    cerrar: () => setPreguntando(false),
    confirmar: () => {
      setPreguntando(false)
      void verificarSeleccionadas(projectId, [...tablero.seleccion])
    }
  }
}
