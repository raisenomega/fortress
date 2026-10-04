import { useAgentDraft } from '../../hooks/useAgentDraft'

interface AgentDraftEditorProps {
  readonly capabilityId: string
}

const AREA = 'w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground'
const BTN = 'rounded bg-primary/10 px-2 py-1 text-[11px] text-primary hover:bg-primary/20'

/** Editor del borrador (dato) del agente y su activacion, con firma humana. */
export function AgentDraftEditor({ capabilityId }: AgentDraftEditorProps): React.JSX.Element {
  const s = useAgentDraft(capabilityId)
  return (
    <div className="border-t border-border pt-3">
      <p className="mb-1 text-[11px] text-foreground">Definicion del agente (borrador, dato)</p>
      <input
        value={s.name}
        onChange={(e) => s.setName(e.target.value)}
        placeholder="Nombre"
        aria-label="Nombre del agente"
        className={`mb-2 ${AREA}`}
      />
      <textarea
        value={s.prompt}
        onChange={(e) => s.setPrompt(e.target.value)}
        rows={4}
        placeholder="Prompt"
        className={AREA}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={s.autodraft} className={BTN}>
          Redactar con agente
        </button>
        <button type="button" onClick={s.save} className={BTN}>
          Guardar
        </button>
        {s.draft ? (
          <button type="button" onClick={s.toggle} className={BTN}>
            {s.draft.active ? 'Desactivar' : 'Aprobar y activar'}
          </button>
        ) : null}
        {s.msg ? <span className="text-[11px] text-muted-foreground">{s.msg}</span> : null}
      </div>
    </div>
  )
}
