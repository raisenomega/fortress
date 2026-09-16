import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'

/**
 * La franja fija de arriba, medida en vivo. Devuelve el `ref` que la marca y el
 * estilo para el contenedor: una variable CSS `--franja` con su alto real, para
 * que la cabecera de columnas se pegue JUSTO debajo y no tape la primera fila.
 *
 * Se mide en vez de fijar un numero porque la franja cambia de alto —aparece,
 * desaparece, se parte en dos lineas al estrechar la ventana—.
 */
export function useFranjaFija(): [RefObject<HTMLDivElement | null>, CSSProperties] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [alto, setAlto] = useState(0)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    const medir = (): void => setAlto(nodo.offsetHeight)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  return [ref, { '--franja': `${alto}px` } as CSSProperties]
}
