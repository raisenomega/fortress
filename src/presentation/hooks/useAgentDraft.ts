import { useEffect, useState } from 'react'
import type { StoredAgentDraft } from '@domain/system/agent-draft-repository'
import {
  activateAgent,
  deactivateAgent,
  draftAgentAuto,
  loadAgentDraft,
  saveAgentDraft
} from '../services/agent-draft-service'

export interface AgentDraftState {
  readonly draft: StoredAgentDraft | null
  readonly name: string
  readonly prompt: string
  readonly msg: string
  setName: (value: string) => void
  setPrompt: (value: string) => void
  save: () => void
  toggle: () => void
  autodraft: () => void
}

/** Estado y acciones del borrador de un agente auto-propuesto, para el modal. */
export function useAgentDraft(capabilityId: string): AgentDraftState {
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
    void saveAgentDraft(capabilityId, { name, prompt, iconName: 'sparkles' }).then((r) => {
      setMsg(r.ok ? 'Borrador guardado' : r.error)
      if (r.ok) setDraft(r.value)
    })
  }
  const toggle = (): void => {
    const run = draft?.active ? deactivateAgent(capabilityId) : activateAgent(capabilityId, true)
    void run.then((r) => {
      setMsg(r.ok ? (draft?.active ? 'Desactivado' : 'Activado') : r.error)
      void loadAgentDraft(capabilityId).then(setDraft)
    })
  }
  const autodraft = (): void => {
    setMsg('Un agente esta redactando...')
    void draftAgentAuto(capabilityId).then((r) => {
      if (r.ok) {
        setDraft(r.value)
        setName(r.value.name)
        setPrompt(r.value.prompt)
      }
      setMsg(r.ok ? 'Borrador redactado por un agente' : r.error)
    })
  }

  return { draft, name, prompt, msg, setName, setPrompt, save, toggle, autodraft }
}
