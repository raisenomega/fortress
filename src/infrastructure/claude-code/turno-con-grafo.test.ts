import { describe, expect, it } from 'vitest'
import type { CodeAgentReply } from '@domain/chat/code-agent'
import type { GrafoDelTurno } from '../graph/grafo-del-turno'
import { turnoConGrafo } from './turno-con-grafo'

const RESPUESTA = { text: 'ok', failed: false } as unknown as CodeAgentReply

function grafoFalso(): { grafo: GrafoDelTurno; liberado: () => number } {
  let veces = 0
  return { grafo: { dir: '/tmp/turno-x', liberar: () => void (veces += 1) }, liberado: () => veces }
}

const noArranco = (motivo: string): CodeAgentReply =>
  ({ text: `No se pudo ejecutar Claude Code: ${motivo}`, failed: true }) as unknown as CodeAgentReply

describe('la copia del grafo del turno se libera pase lo que pase', () => {
  it('cuando el turno responde bien, una vez', async () => {
    const f = grafoFalso()

    await turnoConGrafo(f.grafo, () => Promise.resolve(RESPUESTA), noArranco)

    expect(f.liberado()).toBe(1)
  })

  it('cuando LANZAR revienta antes de que el hijo exista', async () => {
    // Es el caso medido: Node se niega a lanzar si un argumento lleva un byte
    // nulo, y la liberacion vivia solo en el `finally` de la recogida, que en
    // ese camino no se alcanza. Una copia por turno fallido, sin borrar.
    const f = grafoFalso()
    const nulo = Object.assign(new Error('...'), { code: 'ERR_INVALID_ARG_VALUE' })

    const reply = await turnoConGrafo(f.grafo, () => { throw nulo }, noArranco)

    expect(f.liberado()).toBe(1)
    expect(reply.failed).toBe(true)
  })

  it('cuando la recogida se RECHAZA, tambien', async () => {
    const f = grafoFalso()

    await turnoConGrafo(f.grafo, () => Promise.reject(new Error('cayo')), noArranco)

    expect(f.liberado()).toBe(1)
  })

  it('el motivo NO arrastra el mensaje: ahi viaja el prompt entero', async () => {
    // Medido: el `message` de Node incluye «Received '<el argumento>'», y el
    // argumento es el prompt, con las citas del repo auditado dentro.
    const f = grafoFalso()
    const conPrompt = Object.assign(new Error("Received 'api_key_secreta_xyz'"), { code: 'ERR_INVALID_ARG_VALUE' }) // prettier-ignore

    const reply = await turnoConGrafo(f.grafo, () => { throw conPrompt }, noArranco)

    expect(reply.text).not.toContain('api_key_secreta_xyz')
    expect(reply.text).toContain('ERR_INVALID_ARG_VALUE')
  })
})
