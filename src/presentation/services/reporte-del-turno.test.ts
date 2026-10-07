import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { useChatStore } from '../stores/chat-store'
import { useConstruirStore } from '../stores/construir-store'
import { useUiStore } from '../stores/ui-store'
import { asentarReporte, reportarAlChat } from './reporte-del-turno'

/** PASO 89: la vuelta PRECARGA el input del Chat con el reporte COMPLETO
 *  (cabecera + resumen entero) — gemelo exacto del Transferir. El banner de
 *  solo-metadatos del 87 engañaba («hallazgos: 0» sin la prosa) y se fue. */

const usage = { ...EMPTY_USAGE, costUsd: 0.42 }
const salida = {
  assistant: { content: 'Analisis entero del Terminal, con {"apiKey":"***"} tachado.' },
  failed: false,
  edits: ['x.ts'],
  sinCierre: null,
  sinVerificar: false,
  usage,
  modelo: 'claude-opus-5-5',
  hallazgos: 1,
  textoCrudo: 'la clave era sk-ant-SECRETO'
}

describe('el carril de vuelta precarga el input del CTO', () => {
  beforeEach(() => {
    useChatStore.setState({ reporteByProject: {} })
    useConstruirStore.setState({ input: '' })
    useUiStore.setState({ view: 'chat' })
  })

  it('asentar guarda el ReporteDeTarea del proyecto, listo para el badge', () => {
    asentarReporte('p1', salida as never)
    expect(useChatStore.getState().reporteByProject.p1?.modelo).toBe('claude-opus-5-5')
  })

  it('reportar precarga cabecera Y resumen ENTERO en el input, y salta a construir', () => {
    asentarReporte('p1', salida as never)
    reportarAlChat('p1')
    const input = useConstruirStore.getState().input
    expect(input).toContain('[Terminal] hecho')
    expect(input).toContain(salida.assistant.content)
    expect(useUiStore.getState().view).toBe('construir')
  })

  it('el input lleva el lado TACHADO: el crudo vecino jamas entra', () => {
    asentarReporte('p1', salida as never)
    reportarAlChat('p1')
    expect(useConstruirStore.getState().input).not.toContain('sk-ant-SECRETO')
  })

  it('sin reporte no navega ni toca el input: nada de saltos vacios', () => {
    reportarAlChat('p1')
    expect(useConstruirStore.getState().input).toBe('')
    expect(useUiStore.getState().view).toBe('chat')
  })
})

describe('el carril esta MONTADO y el banner se fue (molde: se lee el fuente)', () => {
  it('el badge sigue al pie del Terminal; la vista construir ya no monta banner', () => {
    expect(readFileSync('src/presentation/components/chat/ChatWindow.tsx', 'utf8')).toContain('ReportarAlChat') // prettier-ignore
    expect(readFileSync('src/presentation/components/construir/ConstruirView.tsx', 'utf8')).not.toContain('ReporteEntrante') // prettier-ignore
  })
})
