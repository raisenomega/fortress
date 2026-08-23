import { describe, expect, it } from 'vitest'
import { createRunAccumulator, type RunAccumulator } from './run-accumulator'

const KEY = 'sk-ant-api03-secretazo'

const assistant = (text: string): string =>
  JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text }] } })

const result = (text: string, ok: boolean): string =>
  JSON.stringify({ type: 'result', subtype: ok ? 'success' : 'error', result: text })

const nuevo = (): RunAccumulator => createRunAccumulator(() => {})

describe('createRunAccumulator sin fallo', () => {
  it('devuelve el texto del agente sin redactar: es el objeto de la revision', () => {
    const acc = nuevo()
    acc.absorb(assistant('el repo usa TOKEN=algo en su ejemplo'))
    acc.absorb(result('listo', true))

    const reply = acc.toReply(0)
    expect(reply.failed).toBe(false)
    expect(reply.text).toBe('el repo usa TOKEN=algo en su ejemplo')
  })

  it('el texto del agente gana al detalle tambien cuando falla', () => {
    const acc = nuevo()
    acc.absorb(assistant('avance parcial'))
    acc.addStderr('warning suelto')

    expect(acc.toReply(1).text).toBe('avance parcial')
  })
})

describe('createRunAccumulator con fallo', () => {
  it('redacta el stderr antes de usarlo como detalle', () => {
    const acc = nuevo()
    acc.addStderr(`Error: ANTHROPIC_API_KEY=${KEY} no valida\n`)

    const reply = acc.toReply(1)
    expect(reply.failed).toBe(true)
    expect(reply.text).not.toContain(KEY)
    expect(reply.text).toContain('***')
    expect(reply.text).toContain('Error:')
  })

  it('redacta un secreto partido entre dos trozos de stderr', () => {
    const acc = nuevo()
    acc.addStderr('Error: sk-ant-')
    acc.addStderr('api03-secretazo\n')

    expect(acc.toReply(1).text).not.toContain(KEY)
  })

  it('respalda en el texto final y luego en el codigo de salida', () => {
    const conFinal = nuevo()
    conFinal.absorb(result('el CLI explico el fallo', false))
    expect(conFinal.toReply(1).text).toBe('el CLI explico el fallo')

    expect(nuevo().toReply(2).text).toBe('el proceso termino con codigo 2')
  })
})
