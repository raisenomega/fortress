import { beforeEach, describe, expect, it } from 'vitest'
import { useColaDelLoteStore } from '../stores/cola-del-lote-store'
import { useLoteStore } from '../stores/lote-store'
import { useSettingsStore } from '../stores/settings-store'
import { useToastStore } from '../stores/toast-store'
import { useUiStore } from '../stores/ui-store'
import { useWorkflowStore } from '../stores/workflow-store'
import { prepararLote } from './preparar-lote'

const RESIDUO = 'residuo de Preguntar al Terminal'

beforeEach(() => {
  useLoteStore.getState().limpiar('p1')
  useColaDelLoteStore.getState().descartar()
  useColaDelLoteStore.getState().terminar()
  useWorkflowStore.getState().setDraft(RESIDUO)
  useWorkflowStore.getState().setPending('un mensaje de otra peticion')
  useSettingsStore.getState().setMode('supervisado')
  useUiStore.getState().setView('scan')
})

describe('pulsar «Resolver lote en Terminal» precarga el plan y espera', () => {
  it('en supervisado: borrador con el plan, lote pendiente, y NO arranca', () => {
    useLoteStore.getState().alternar('p1', 'f1')
    useLoteStore.getState().alternar('p1', 'f2')

    prepararLote('p1', 'mailbd-main')

    expect(useWorkflowStore.getState().draft).toContain('los 2 hallazgos seleccionados')
    expect(useWorkflowStore.getState().draft).not.toContain(RESIDUO)
    expect(useWorkflowStore.getState().pendingPrompt).toBeNull()
    expect(useColaDelLoteStore.getState().pendiente).toEqual({
      projectId: 'p1',
      ids: ['f1', 'f2'],
      planeado: false,
      veredicto: null
    })
    expect(useColaDelLoteStore.getState().enCurso).toBeNull()
    expect(useUiStore.getState().view).toBe('chat')
  })

  it('en autonomo TAMBIEN precarga: el modo decide el flujo, no el permiso', () => {
    useSettingsStore.getState().setMode('autonomo')
    useLoteStore.getState().alternar('p1', 'f1')
    const avisosAntes = useToastStore.getState().toasts.length

    prepararLote('p1', 'mailbd-main')
    prepararLote('p1', 'mailbd-main')

    // ADR-090, A.1c: antes esto se cortaba en seco y el boton quedaba muerto.
    expect(useColaDelLoteStore.getState().pendiente?.ids).toEqual(['f1'])
    expect(useWorkflowStore.getState().draft).not.toBe(RESIDUO)
    expect(useUiStore.getState().view).toBe('chat')
    // Lo dice la barra antes de pulsar; repetirlo aqui era lo que molestaba.
    expect(useToastStore.getState().toasts).toHaveLength(avisosAntes)
  })

  it('sin nada elegido no hace nada', () => {
    prepararLote('p1', 'mailbd-main')

    expect(useColaDelLoteStore.getState().pendiente).toBeNull()
    expect(useWorkflowStore.getState().draft).toBe(RESIDUO)
  })
})
