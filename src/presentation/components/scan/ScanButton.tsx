import { Icon } from '../common/Icon'

interface ScanButtonProps {
  readonly running: boolean
  /** Hay otro proyecto escaneandose: solo corre un scan a la vez. */
  readonly busyElsewhere: boolean
  readonly onScan: () => void
}

export function ScanButton({ running, busyElsewhere, onScan }: ScanButtonProps): React.JSX.Element {
  const label = running ? 'Escaneando...' : 'Escanear seguridad'

  return (
    <button
      type="button"
      onClick={onScan}
      disabled={running || busyElsewhere}
      title={busyElsewhere ? 'Hay otro escaneo en curso' : 'Audita el codigo en disco'}
      className="tap flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
    >
      <Icon name={running ? 'zap' : 'shield'} size={13} />
      {label}
    </button>
  )
}
