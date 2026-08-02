interface StepActionsProps {
  readonly confirmLabel: string
  readonly disabled: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
}

export function StepActions({
  confirmLabel,
  disabled,
  onCancel,
  onConfirm
}: StepActionsProps): React.JSX.Element {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="tap rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        Cancelar
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onConfirm}
        className="tap rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
      >
        {confirmLabel}
      </button>
    </div>
  )
}
