interface PlanActionsProps {
  readonly empty: boolean
  readonly onCancel: () => void
  readonly onApprove: () => void
}

export function PlanActions({ empty, onCancel, onApprove }: PlanActionsProps): React.JSX.Element {
  return (
    <div className="mt-4 flex items-center justify-end gap-2">
      {empty ? (
        <p className="mr-auto text-[11px] text-critical">
          Todos los agentes de este workflow estan excluidos: no hay nada que ejecutar.
        </p>
      ) : null}
      <button
        type="button"
        onClick={onCancel}
        className="tap rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onApprove}
        disabled={empty}
        className="tap rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
      >
        Ejecutar
      </button>
    </div>
  )
}
