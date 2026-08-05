import { useEffect, useState } from 'react'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import {
  activateAgent,
  deactivateAgent,
  loadAgentDraft,
  saveAgentDraft
} from '../../services/self-improvement-service'

interface AgentDraftEditorProps {
  readonly capabilityId: string
}

const AREA = 'w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground'
const BTN = 'rounded bg-primary/10 px-2 py-1 text-[11px] text-primary hover:bg-primary/20'

/** Editor del borrador (dato) del agente y su activacion, con firma humana. */
export function AgentDraftEditor({ capabilityId }: AgentDraftEditorProps): React.JSX.Element {
  const [draft, setDraft] = useState<StoredAgentDraft | null>(null)
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    void loadAgentDraft(capabilityId).then((current) => {
      setDraft(current)
      setName(current?.name ?? '')
      setPrompt(current?.prompt ?? '')
    })
  }, [capabilityId])

  const save = (): void => {
    void saveAgentDraft(capabilityId, { name, prompt, iconName: 'sparkles' }).then((result) => {
      setMsg(result.ok ? 'Borrador guardado' : result.error)
      if (result.ok) setDraft(result.value)
    })
  }
  const toggle = (): void => {
    const run = draft?.active ? deactivateAgent(capabilityId) : activateAgent(capabilityId, true)
    void run.then((result) => {
      setMsg(result.ok ? (draft?.active ? 'Desactivado' : 'Activado') : result.error)
      void loadAgentDraft(capabilityId).then(setDraft)
    })
  }

  return (
    <div className="border-t border-border pt-3">
      <p className="mb-1 text-[11px] text-foreground">Definicion del agente (borrador, dato)</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className={`mb-2 ${AREA}`} />
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Prompt" className={AREA} />
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={save} className={BTN}>Guardar</button>
        {draft ? (
          <button type="button" onClick={toggle} className={BTN}>
            {draft.active ? 'Desactivar' : 'Aprobar y activar'}
          </button>
        ) : null}
        {msg ? <span className="text-[11px] text-muted-foreground">{msg}</span> : null}
      </div>
    </div>
  )
}
