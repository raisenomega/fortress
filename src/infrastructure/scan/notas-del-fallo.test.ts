import { describe, expect, it, vi } from 'vitest'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { IntentoFallido } from '@domain/scan/intento-fallido'
import { createClaudeScanner } from './claude-scanner'

vi.mock('../project/discover-corpus', () => ({ discoverCorpus: () => ({ docs: [], directories: [] }) })) // prettier-ignore

const SIN_FACTURA = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, costUsd: 0, numTurns: 0 } // prettier-ignore

const NOTA = '{"kind":"limitacion","area":"consulta-del-grafo","note":"el grafo no da politicas SQL"}'

function conSalida(text: string): CodeAgent {
  return {
    isAvailable: () => true,
    precheck: () => null,
    run: () => Promise.resolve({ text, failed: false, denials: [], usage: SIN_FACTURA, tools: [], edits: [] }) // prettier-ignore
  }
}

async function avisoDe(text: string): Promise<IntentoFallido> {
  const avisos: IntentoFallido[] = []
  const scanner = createClaudeScanner(conSalida(text), (i) => avisos.push(i))
  await scanner.scan({ projectPath: '/tmp/p', projectName: 'p', projectId: 'p1' }, () => undefined)
  return avisos[0]
}

describe('el aprendizaje sobre FORTRESS sobrevive al informe que no se entendio', () => {
  it('el aviso del fallo lleva las notas del MISMO bloque', async () => {
    // `notes` es clave HERMANA de `findings` y la valida su propio parser: se lee
    // bien aunque ningun hallazgo lo haga. Perderla era tirar el unico aprendizaje
    // que ese escaneo dejaba, y el escaneo ya costo el dinero igual.
    const aviso = await avisoDe(`x\n\n\`\`\`json\n{"resumen":"sin lista","notes":[${NOTA}]}\n\`\`\``)

    expect(aviso.motivo).toBe('informe-ilegible')
    expect(aviso.notas).toHaveLength(1)
    expect(aviso.notas[0].area).toBe('consulta-del-grafo')
  })

  it('sin bloque que leer no se inventa ninguna nota', async () => {
    expect((await avisoDe('un muro de analisis sin bloque')).notas).toEqual([])
  })
})
