import { describe, expect, it } from 'vitest'
import { parseStreamLine } from './stream-events'

/** Lineas tomadas de la salida real de `claude -p --output-format stream-json`. */
const ASSISTANT_TEXT = JSON.stringify({
  type: 'assistant',
  message: { content: [{ type: 'text', text: 'OK' }] }
})

const ASSISTANT_TOOL = JSON.stringify({
  type: 'assistant',
  message: { content: [{ type: 'tool_use', name: 'Read', input: {} }] }
})

const RESULT_OK = JSON.stringify({
  type: 'result',
  subtype: 'success',
  is_error: false,
  result: 'listo'
})

describe('parseStreamLine', () => {
  it('ignora lineas vacias y texto que no es JSON', () => {
    expect(parseStreamLine('')).toBeNull()
    expect(parseStreamLine('   ')).toBeNull()
    expect(parseStreamLine('aviso suelto del CLI')).toBeNull()
  })

  it('ignora eventos que no interesan a la UI', () => {
    expect(parseStreamLine(JSON.stringify({ type: 'system', subtype: 'init' }))).toBeNull()
    expect(parseStreamLine(JSON.stringify({ type: 'rate_limit_event' }))).toBeNull()
  })

  it('extrae el texto del asistente', () => {
    expect(parseStreamLine(ASSISTANT_TEXT)?.text).toBe('OK')
  })

  it('avisa de la herramienta usada, para que se vea actividad', () => {
    expect(parseStreamLine(ASSISTANT_TOOL)?.tool).toBe('Read')
  })

  it('marca el resultado final como correcto', () => {
    const event = parseStreamLine(RESULT_OK)
    expect(event?.finalText).toBe('listo')
    expect(event?.failed).toBe(false)
  })

  it('detecta el fallo tanto por is_error como por subtype', () => {
    const porFlag = JSON.stringify({ type: 'result', subtype: 'success', is_error: true })
    const porSubtype = JSON.stringify({ type: 'result', subtype: 'error_max_turns' })
    expect(parseStreamLine(porFlag)?.failed).toBe(true)
    expect(parseStreamLine(porSubtype)?.failed).toBe(true)
  })

  it('resume lo que el modo de permisos bloqueo', () => {
    const line = JSON.stringify({
      type: 'result',
      subtype: 'success',
      permission_denials: [{ tool_name: 'Write', tool_input: { command: 'rm -rf /' } }]
    })
    expect(parseStreamLine(line)?.denials).toEqual(['rm -rf /'])
  })
})

describe('denegaciones de permiso', () => {
  it('tacha el secreto del comando bloqueado antes de que se persista', () => {
    const blocked = [{ tool_name: 'Bash', tool_input: { command: 'export KEY=sk-ant-abc123def' } }]
    const line = JSON.stringify({ type: 'result', subtype: 'success', permission_denials: blocked })
    const denials = parseStreamLine(line)?.denials ?? []
    expect(denials[0]).toContain('***')
    expect(denials[0]).not.toContain('abc123def')
  })
})
