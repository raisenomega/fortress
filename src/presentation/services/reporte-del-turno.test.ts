import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { useChatStore } from '../stores/chat-store'
import { useConstruirStore } from '../stores/construir-store'
import { useUiStore } from '../stores/ui-store'
import { asentarReporte, reportarAlChat } from './reporte-del-turno'

/** PASO 87, el carril de vuelta: el gemelo del Transferir pero CON CARGA —
 *  navegar sin el reporte seria la navegacion vacia que ya existia. */

const salida = {
  assistant: { content: 'hecho y tachado' },
  failed: false,
  edits: ['x.ts'],
  sinCierre: null,
  sinVerificar: false,
  usage: EMPTY_USAGE,
  modelo: 'claude-opus-5-5',
  hallazgos: 1
}

describe('el carril de vuelta Terminal -> Chat', () => {
  beforeEach(() => {
    useChatStore.setState({ reporteByProject: {} })
    useConstruirStore.setState({ reporteEntrante: null })
    useUiStore.setState({ view: 'chat' })
  })

  it('asentar guarda el ReporteDeTarea del proyecto, listo para el badge', () => {
    asentarReporte('p1', salida as never)
    expect(useChatStore.getState().reporteByProject.p1?.estado).toBe('hecho')
    expect(useChatStore.getState().reporteByProject.p1?.modelo).toBe('claude-opus-5-5')
  })

  it('reportar lleva LA CARGA a la vista del CTO y salta a construir', () => {
    asentarReporte('p1', salida as never)
    reportarAlChat('p1')
    expect(useConstruirStore.getState().reporteEntrante?.edits).toEqual(['x.ts'])
    expect(useUiStore.getState().view).toBe('construir')
  })

  it('sin reporte no navega: nada de saltos vacios', () => {
    reportarAlChat('p1')
    expect(useUiStore.getState().view).toBe('chat')
  })
})

describe('el carril esta MONTADO (molde de la casa: se lee el fuente)', () => {
  it('el badge cuelga del pie del Terminal y el bloque entra en la vista construir', () => {
    expect(readFileSync('src/presentation/components/chat/ChatWindow.tsx', 'utf8')).toContain('ReportarAlChat') // prettier-ignore
    expect(readFileSync('src/presentation/components/construir/ConstruirView.tsx', 'utf8')).toContain('ReporteEntrante') // prettier-ignore
  })
})
