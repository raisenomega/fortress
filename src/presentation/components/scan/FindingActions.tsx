import { EyeOff, RotateCcw } from 'lucide-react'

interface FindingActionsProps {
  readonly dismissed: boolean
  readonly onDismiss: () => void
  readonly onReopen: () => void
}

/** Descartar: "no era un problema". La otra decision del operador —"lo era y ya
 *  lo arregle"— vive en `FindingMitigarAction`, que necesita estado propio para
 *  el dialogo de la nota; aqui no hay nada que preguntar. Son distintas a
 *  proposito: mezclarlas haria que descartar pareciera arreglar. */
export function FindingActions({
  dismissed,
  onDismiss,
  onReopen
}: FindingActionsProps): React.JSX.Element {
  return (
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
  )
}
