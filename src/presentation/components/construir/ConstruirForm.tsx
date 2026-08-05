import { useConstruirStore } from '../../stores/construir-store'

interface ConstruirFormProps {
  readonly onPrepare: (intent: string) => void
}

/** Fase idle: el operador describe la feature; al preparar, el planner la disena. */
export function ConstruirForm({ onPrepare }: ConstruirFormProps): React.JSX.Element {
  const intent = useConstruirStore((s) => s.intent)
  const setIntent = useConstruirStore((s) => s.setIntent)
  const ready = intent.trim().length > 0

  return (
    <div className="space-y-3">
      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        placeholder="Describe la funcionalidad a construir..."
        className="h-32 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
      <button
        type="button"
        disabled={!ready}
        onClick={() => onPrepare(intent.trim())}
        className="tap rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
      >
        Preparar plan
      </button>
    </div>
  )
}
