import { describe, expect, it, vi } from 'vitest'
import type { AppContext } from '@application/context'
import type { CodeAgent, CodeAgentReply } from '@domain/chat/code-agent'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { ESTA_INSTALACION } from '@domain/system/observacion-de-fallo'
import { createMemoryDb } from '../persistence/memory-db'
import { createSqliteSelfObservationRepository } from '../persistence/sqlite-self-observation-repository'

/** PASO 161b: el CTO y el chat-libre SEÑALAN una mejora de FORTRESS como TEXTO
 *  (bloque NOTAS); la APP la extrae y asienta, el carril sigue sin herramientas.
 *  T4 (el mutante que importa): el origen es EXACTAMENTE ESTA_INSTALACION —ni el
 *  proyecto cliente, ni una sala ('chat-cto'): el origen canonico FORTRESS-side. */
const NOTA = '{"kind":"limitacion","area":"otro","note":"el CTO no pudo medir X"}'
const BLOQUE = `NOTAS:[${NOTA}]:END-NOTAS`
const agente = vi.hoisted(() => ({ texto: '', failed: false }))

vi.mock('electron', () => ({ app: { getPath: (): string => '/tmp/fcc-161b-userdata' } }))
vi.mock('./rebanada-del-libro', () => ({ rebanadaDelLibro: () => Promise.resolve([]) }))
vi.mock('./build-target', () => ({
  agentLibre: (): CodeAgent => ({
    isAvailable: (): boolean => true,
    precheck: (): null => null,
    run: (): Promise<CodeAgentReply> =>
      Promise.resolve({ text: agente.texto, failed: agente.failed, denials: [], usage: EMPTY_USAGE, tools: [], edits: [] }) // prettier-ignore
  })
}))

const { runCto } = await import('./run-cto')
const { runLibre } = await import('./run-libre')
const ctx = (): AppContext =>
  ({
    selfObservations: createSqliteSelfObservationRepository(createMemoryDb())
  }) as unknown as AppContext

describe('el CTO y el chat-libre observan (PASO 161b)', () => {
  it('el CTO asienta bajo ESTA_INSTALACION, NUNCA el proyecto anclado del cliente', async () => {
    const c = ctx()
    agente.texto = `Mi analisis.\n\n${BLOQUE}`
    agente.failed = false
    const r = await runCto(c, 'pregunta', [], 'cliente-x', () => {})
    const obs = c.selfObservations.listOpen()
    expect(obs).toMatchObject([
      { kind: 'limitacion', area: 'otro', sourceProject: ESTA_INSTALACION }
    ])
    expect(obs.every((o) => o.sourceProject === ESTA_INSTALACION)).toBe(true)
    expect(r.ok && r.value).not.toContain('NOTAS:')
  })

  it('el chat-libre asienta bajo ESTA_INSTALACION y la respuesta vuelve sin el bloque', async () => {
    const c = ctx()
    agente.texto = `Te cuento.\n\n${BLOQUE}`
    agente.failed = false
    const r = await runLibre(c, 'hola', [], () => {})
    const obs = c.selfObservations.listOpen()
    expect(obs).toMatchObject([
      { kind: 'limitacion', area: 'otro', sourceProject: ESTA_INSTALACION }
    ])
    expect(obs.every((o) => o.sourceProject === ESTA_INSTALACION)).toBe(true)
    expect(r.ok && r.value).not.toContain('NOTAS:')
  })

  it('sin bloque NOTAS: cero observaciones en ambos carriles', async () => {
    const a = ctx()
    agente.texto = 'Solo texto, sin notas.'
    agente.failed = false
    await runCto(a, 'q', [], null, () => {})
    const b = ctx()
    await runLibre(b, 'hola', [], () => {})
    expect(a.selfObservations.listOpen()).toHaveLength(0)
    expect(b.selfObservations.listOpen()).toHaveLength(0)
  })
})
