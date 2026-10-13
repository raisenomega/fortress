import { useEffect, useRef, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { Project } from '@domain/project/project'
import { useBreakdownStore } from '../../stores/breakdown-store'
import { useCerrarConEscape } from '../../hooks/useCerrarConEscape'
import { ScoreBreakdown } from './ScoreBreakdown'

interface BreakdownPopoverProps {
  readonly project: Project
  /** Rect de la tarjeta: el popover flota anclado debajo, sin mover nada. */
  readonly anchor: DOMRect
}

/**
 * Foco al abrir y retorno al chevron al cerrar, SIN la trampa de Tab de
 * useFocoDelDialogo: no es modal y su contenido no tiene enfocables. Solo se
 * devuelve si el foco seguia dentro (o se perdio en body): tras un clic fuera
 * no se le roba el sitio al elemento recien pulsado.
 */
function useFocoDelPopover(caja: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const nodo = caja.current
    if (nodo === null) return
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!nodo.contains(document.activeElement)) nodo.focus()
    return () => {
      const activo = document.activeElement
      const perdido = activo === null || activo === document.body || nodo.contains(activo)
      if (perdido && previo?.isConnected) previo.focus()
    }
  }, [caja])
}

/**
 * Popover FLOTANTE: se renderiza en document.body (portal) con position:fixed, asi
 * no reflota la tarjeta ni el header (overflow-x-auto lo recortaria) ni empuja el
 * chat de abajo. Se cierra al clic fuera (salvo en el chevron, que togglea solo)
 * y con Escape. Dialogo NO modal: sin aria-modal, no tapa la pagina.
 */
export function BreakdownPopover({ project, anchor }: BreakdownPopoverProps): React.JSX.Element {
  const close = useBreakdownStore((state) => state.close)
  const ref = useRef<HTMLDivElement>(null)
  useCerrarConEscape(close)
  useFocoDelPopover(ref)

  useEffect(() => {
    const onDown = (event: MouseEvent): void => {
      const target = event.target as HTMLElement
      if (ref.current?.contains(target) || target.closest('[data-breakdown-toggle]')) return
      close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [close])

  return createPortal(
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-label="Desglose de calidad"
      style={{ position: 'fixed', left: anchor.left, top: anchor.bottom + 4, width: anchor.width }}
      className="z-50 rounded-lg border border-primary/40 bg-card p-3 shadow-xl outline-none"
    >
      <ScoreBreakdown project={project} />
    </div>,
    document.body
  )
}
