import { useEffect, useRef, type RefObject } from 'react'

/** El gesto del Terminal: pegar la vista al pie. Aparte del hook para probarlo
 *  sin React (jsdom no implementa `scrollIntoView`). */
export function pegarAlFondo(el: HTMLElement | null): void {
  el?.scrollIntoView({ block: 'end' })
}

/**
 * Mantiene la vista pegada al fondo cuando cambia `señal` —el hilo o su borrador
 * en vivo—, el MISMO gesto que ya hacia el Terminal, ahora compartido por todos
 * los canales del chat (PASO 174). Como el Terminal, NO pausa al subir: cada
 * cambio vuelve al pie. Devuelve el ref para un div al final del scroll.
 */
export function usePegadoAlFondo(señal: unknown): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    pegarAlFondo(ref.current)
  }, [señal])
  return ref
}
