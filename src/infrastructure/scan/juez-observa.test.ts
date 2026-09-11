import { describe, expect, it } from 'vitest'
import type { CodeAgent } from '@domain/chat/code-agent'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import type { SelfNoteDraft } from '@domain/system/self-observation'
import { crearJuez } from './juez-de-aplicabilidad'

const APLICA = 'APLICA:[{"modulo":"M8","aplica":"si","porque":"src/pagos.ts:31 cobra"}]:END-APLICA'
const NOTAS = 'NOTAS:[{"kind":"falta","area":"juicio","note":"sin grafo no pude confirmarlo"}]:END-NOTAS' // prettier-ignore

const agente = (texto: string): CodeAgent => ({
  isAvailable: () => true,
  precheck: () => null,
  run: async () => ({ text: texto, failed: false, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] }) // prettier-ignore
})

async function correr(texto: string): Promise<{ veredictos: number; notas: SelfNoteDraft[] }> {
  const recogidas: SelfNoteDraft[] = []
  const juez = crearJuez(agente(texto), 'p1', () => undefined, (n) => recogidas.push(...n)) // prettier-ignore
  const veredictos = await juez('/tmp/p', ['M8'], ['src'])
  return { veredictos: veredictos.length, notas: recogidas }
}

describe('el juez responde DOS bloques: su veredicto y lo que noto', () => {
  it('los dos se leen, y son independientes', async () => {
    const { veredictos, notas } = await correr(`${APLICA}\n${NOTAS}`)

    expect(veredictos).toBe(1)
    expect(notas).toEqual([
      { kind: 'falta', area: 'juicio', note: 'sin grafo no pude confirmarlo' }
    ])
  })

  it('sin bloque NOTAS el veredicto se lee igual: la nota es opcional', async () => {
    const { veredictos, notas } = await correr(APLICA)

    expect(veredictos).toBe(1)
    expect(notas).toEqual([])
  })

  it('y sin veredicto la NOTA sobrevive: un juicio vacio es lo normal', async () => {
    // Cuando el modelo no encuentra con que respaldar responde sin veredictos, y
    // el limite del que se topo es justo lo que hay que saber.
    const { veredictos, notas } = await correr(`APLICA:[]:END-APLICA\n${NOTAS}`)

    expect(veredictos).toBe(0)
    expect(notas).toHaveLength(1)
  })
})
