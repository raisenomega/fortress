import { useState } from 'react'
import { paginar, type Pagina } from '../components/system/paginacion'

export interface Paginado<T> {
  readonly visibles: readonly T[]
  readonly pagina: Pagina
  readonly irA: (numero: number) => void
}

/**
 * El trozo de la lista que se ve, y por donde va.
 *
 * La pagina PEDIDA se guarda tal cual y se acota al usarla, no al pulsarla: la
 * lista encoge sola —firmar saca una propuesta, el motor cierra otra— y acotar
 * al pulsar dejaria el estado en un numero que dejo de existir. Asi, si la
 * lista vuelve a crecer, la pagina que se estaba mirando sigue ahi.
 */
export function usePaginado<T>(items: readonly T[]): Paginado<T> {
  const [pedida, setPedida] = useState(1)
  const pagina = paginar(items.length, pedida)
  return { visibles: items.slice(pagina.desde, pagina.hasta), pagina, irA: setPedida }
}
