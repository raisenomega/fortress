import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'

/**
 * Una franja fija medida en vivo. Devuelve el `ref` que la marca y el estilo
 * para el contenedor: la variable CSS `nombre` con su alto real, para que lo
 * siguiente se pegue JUSTO debajo y no tape lo que hay abajo.
 *
 * Se mide en vez de fijar un numero porque estas franjas cambian de alto
 * —aparecen, desaparecen, se parten en dos lineas al estrechar la ventana—.
 * En el Escaneo se apilan tres: `--cabecera` (nombre y botones del proyecto),
 * `--franja` (barras de seleccion y lote) y encima de ambas la fila de columnas.
 */
export function useFranjaFija(nombre: string): [RefObject<HTMLDivElement | null>, CSSProperties] {
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

  return [ref, { [nombre]: `${alto}px` } as CSSProperties]
}
