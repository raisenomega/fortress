import { useConstruirStore } from '../../stores/construir-store'

interface ConstruirReviewProps {
  readonly onApprove: () => void
  readonly onCancel: () => void
}

/** Fase review: se muestra el plan y NADA se escribe hasta que el humano aprueba. */
export function ConstruirReview({ onApprove, onCancel }: ConstruirReviewProps): React.JSX.Element {
  const plan = useConstruirStore((s) => s.plan)

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Plan propuesto. Nada se escribe hasta que lo apruebes; se hace checkpoint git y, si la
        verificacion queda en rojo, se revierte solo.
      </p>
      <pre className="max-h-80 overflow-y-auto rounded-md border border-border bg-background px-3 py-2 text-xs whitespace-pre-wrap text-foreground">
        {plan}
      </pre>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="tap rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Aprobar y construir
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="tap rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/40"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
