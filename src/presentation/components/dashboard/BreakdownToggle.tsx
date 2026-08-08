import { Icon } from '../common/Icon'

interface BreakdownToggleProps {
  readonly open: boolean
  readonly onToggle: () => void
}

/** Chevron en la esquina de la tarjeta: abajo = cerrado, arriba = abierto. */
export function BreakdownToggle({ open, onToggle }: BreakdownToggleProps): React.JSX.Element {
  return (
    <button
      type="button"
      data-breakdown-toggle
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? 'Cerrar desglose de calidad' : 'Ver desglose de calidad'}
      className="tap absolute right-1.5 bottom-1.5 rounded p-0.5 text-muted-foreground hover:text-primary"
    >
      <Icon name={open ? 'chevron-up' : 'chevron-down'} size={15} />
    </button>
  )
}
