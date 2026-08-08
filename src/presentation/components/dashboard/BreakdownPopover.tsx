import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Project } from '@domain/project/project'
import { useBreakdownStore } from '../../stores/breakdown-store'
import { ScoreBreakdown } from './ScoreBreakdown'

interface BreakdownPopoverProps {
  readonly project: Project
  /** Rect de la tarjeta: el popover flota anclado debajo, sin mover nada. */
  readonly anchor: DOMRect
}

/**
 * Popover FLOTANTE: se renderiza en document.body (portal) con position:fixed, asi
 * no reflota la tarjeta ni el header (overflow-x-auto lo recortaria) ni empuja el
 * chat de abajo. Se cierra al clic fuera (salvo en el chevron, que togglea solo).
 */
export function BreakdownPopover({ project, anchor }: BreakdownPopoverProps): React.JSX.Element {
  const close = useBreakdownStore((state) => state.close)
  const ref = useRef<HTMLDivElement>(null)

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
      style={{ position: 'fixed', left: anchor.left, top: anchor.bottom + 4, width: anchor.width }}
      className="z-50 rounded-lg border border-primary/40 bg-card p-3 shadow-xl"
    >
      <ScoreBreakdown project={project} />
    </div>,
    document.body
  )
}
