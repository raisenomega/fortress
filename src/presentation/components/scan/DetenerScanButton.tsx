import { Icon } from '../common/Icon'

interface DetenerScanButtonProps {
  readonly onStop: () => void
}

/**
 * Detener el recorrido. Molde del boton del chat, con el matiz que trae ADR-082:
 * la parada EN CURSO termina y se guarda; solo las que faltan no arrancan.
 */
export function DetenerScanButton({ onStop }: DetenerScanButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onStop}
      title="Detener. La parada en curso termina y se guarda; las que faltan no se ejecutan"
      className="tap flex items-center gap-2 rounded-md bg-critical px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:brightness-110"
    >
      <Icon name="square" size={13} />
      Detener
    </button>
  )
}
