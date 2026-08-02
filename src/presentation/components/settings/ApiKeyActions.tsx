interface ApiKeyActionsProps {
  readonly hasApiKey: boolean
  readonly canSave: boolean
  readonly onClear: () => void
  readonly onCancel: () => void
  readonly onSave: () => void
}

export function ApiKeyActions({
  hasApiKey,
  canSave,
  onClear,
  onCancel,
  onSave
}: ApiKeyActionsProps): React.JSX.Element {
  return (
    <footer className="mt-4 flex items-center justify-end gap-2">
      {hasApiKey ? (
        <button
          type="button"
          onClick={onClear}
          className="tap mr-auto rounded-md px-3 py-1.5 text-xs text-critical hover:bg-critical/10"
        >
          Borrar la key guardada
        </button>
      ) : null}
      <button
        type="button"
        onClick={onCancel}
        className="tap rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
      >
        Cancelar
      </button>
      <button
        type="button"
        disabled={!canSave}
        onClick={onSave}
        className="tap rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
      >
        Guardar
      </button>
    </footer>
  )
}
