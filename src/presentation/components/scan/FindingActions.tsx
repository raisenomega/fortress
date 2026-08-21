import { EyeOff, RotateCcw, Wrench } from 'lucide-react'

interface FindingActionsProps {
  readonly dismissed: boolean
  readonly mitigado: boolean
  readonly onDismiss: () => void
  readonly onReopen: () => void
  readonly onMitigate: () => void
  readonly onUnmitigate: () => void
}

/** Las dos decisiones que el operador puede tomar sobre un hallazgo, y que son
 *  distintas: "no era un problema" (descartar) y "lo era y ya lo arregle"
 *  (mitigar). Mitigar no se ofrece sobre lo ya descartado ni sobre lo ya
 *  mitigado — no hay nada que declarar dos veces. */
export function FindingActions({
  dismissed,
  mitigado,
  onDismiss,
  onReopen,
  onMitigate,
  onUnmitigate
}: FindingActionsProps): React.JSX.Element {
  return (
    <>
      {!dismissed && !mitigado ? (
        <button
          type="button"
          onClick={onMitigate}
          title="Marcar como ya arreglado: sale de la cola del motor y sigue visible"
          className="tap mr-2 text-muted-foreground hover:text-foreground"
        >
          <Wrench size={13} aria-hidden />
        </button>
      ) : null}
      {mitigado ? (
        <button
          type="button"
          onClick={onUnmitigate}
          title="Deshacer: vuelve a la cola del motor"
          className="tap mr-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw size={13} aria-hidden />
        </button>
      ) : null}
      <button
        type="button"
        onClick={dismissed ? onReopen : onDismiss}
        title={
          dismissed
            ? 'Volver a contarlo'
            : 'Descartar como falso positivo: dejara de contar y de bloquear el push'
        }
        className="tap text-muted-foreground hover:text-foreground"
      >
        {dismissed ? <RotateCcw size={13} aria-hidden /> : <EyeOff size={13} aria-hidden />}
      </button>
    </>
  )
}
