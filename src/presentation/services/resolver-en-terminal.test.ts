import { beforeEach, describe, expect, it } from 'vitest'
import type { Finding } from '@domain/project/finding'
import { useUiStore } from '../stores/ui-store'
import { useWorkflowStore } from '../stores/workflow-store'
import { borradorDeResolucion, resolverEnTerminal } from './resolver-en-terminal'

const hallazgo = {
  id: 'f1',
  severity: 'CRITICAL',
  title: 'El checkout cobra el precio del cuerpo',
  file: 'api/checkout.ts',
  line: 42,
  status: 'open',
  lifecycle: 'ACTIVE'
} as Finding

beforeEach(() => {
  useWorkflowStore.setState({ pendingPrompt: null, draft: '', foco: null })
  useUiStore.getState().setView('scan')
})

describe('pulsar «Resolver en Terminal»', () => {
  it('abre el Terminal con el foco puesto y el borrador escrito', () => {
    resolverEnTerminal('p1', hallazgo)

    expect(useUiStore.getState().view).toBe('chat')
    expect(useWorkflowStore.getState().foco).toEqual({ projectId: 'p1', findingId: 'f1' })
    expect(useWorkflowStore.getState().draft).toBe(borradorDeResolucion(hallazgo))
  })

  it('el borrador nombra el hallazgo para que el operador sepa que envia', () => {
    expect(borradorDeResolucion(hallazgo)).toBe(
      'Resuelve este hallazgo CRITICAL de api/checkout.ts:42: El checkout cobra el precio del cuerpo'
    )
  })

  it('no envia nada: solo prepara el Terminal', () => {
    resolverEnTerminal('p1', hallazgo)

    expect(useWorkflowStore.getState().pendingPrompt).toBeNull()
  })

  it('un mensaje que esperaba aprobacion se descarta: no saldria con este foco', () => {
    useWorkflowStore.getState().setPending('otra peticion de antes')

    resolverEnTerminal('p1', hallazgo)

    expect(useWorkflowStore.getState().pendingPrompt).toBeNull()
  })
})
