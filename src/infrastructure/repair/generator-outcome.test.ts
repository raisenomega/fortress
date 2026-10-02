import { describe, expect, it } from 'vitest'
import { MAX_TURNS } from './generator-args'
import { desenlaceDelGenerador } from './generator-outcome'

const salida = (extra: Record<string, unknown>): string =>
  JSON.stringify({
    type: 'result',
    total_cost_usd: 1.5,
    num_turns: 30,
    usage: { input_tokens: 40, output_tokens: 20_000, cache_read_input_tokens: 900_000 },
    ...extra
  })

describe('desenlaceDelGenerador', () => {
  it('agotar los turnos tiene desenlace propio y honesto', () => {
    const fin = desenlaceDelGenerador(salida({ subtype: 'error_max_turns', is_error: true }), 1)
    expect(fin.ok).toBe(false)
    if (fin.ok) return
    expect(fin.turnosAgotados).toBe(true)
    expect(fin.error).toBe(`no completo en ${MAX_TURNS} turnos`)
  })

  it('no se disfraza de averia del generador aunque el CLI salga con codigo 1', () => {
    const fin = desenlaceDelGenerador(salida({ subtype: 'error_max_turns' }), 1)
    expect(fin.ok).toBe(false)
    if (fin.ok) return
    expect(fin.error).not.toContain('codigo')
  })

  it('la factura se conserva al quedarse sin turnos: se pago, se apunta', () => {
    const fin = desenlaceDelGenerador(salida({ subtype: 'error_max_turns' }), 1)
    expect(fin.usage?.outputTokens).toBe(20_000)
    expect(fin.usage?.numTurns).toBe(30)
  })

  it('una corrida buena sigue siendo buena', () => {
    expect(desenlaceDelGenerador(salida({ subtype: 'success' }), 0).ok).toBe(true)
  })

  it('un fallo cualquiera sigue diciendo su codigo', () => {
    const fin = desenlaceDelGenerador(salida({ subtype: 'success' }), 7)
    expect(fin.ok).toBe(false)
    if (fin.ok) return
    expect(fin.turnosAgotados).toBeUndefined()
    expect(fin.error).toContain('codigo 7')
  })

  it('sin JSON la factura queda AUSENTE, que no es una de ceros', () => {
    const fin = desenlaceDelGenerador('cualquier cosa', 1)
    expect(fin.usage).toBeUndefined()
  })
})

describe('desenlaceDelGenerador: la sesion, para poder reanudarla', () => {
  it('la corrida buena deja su sesion', () => {
    const fin = desenlaceDelGenerador(salida({ subtype: 'success', session_id: 'ses-1' }), 0)
    expect(fin.sesion).toBe('ses-1')
  })

  it('la que agoto los turnos TAMBIEN: es la que mas merece continuarse', () => {
    const fin = desenlaceDelGenerador(salida({ subtype: 'error_max_turns', session_id: 'ses-2' }), 1) // prettier-ignore
    expect(fin.sesion).toBe('ses-2')
  })

  it('cero turnos NO es una sesion: es la firma de un --resume que no encontro nada', () => {
    const out = JSON.stringify({ type: 'result', num_turns: 0, session_id: 'ses-nueva', usage: { input_tokens: 1, output_tokens: 1 } }) // prettier-ignore
    expect(desenlaceDelGenerador(out, 1).sesion).toBeUndefined()
  })

  it('sin JSON no hay sesion que inventar', () => {
    expect(desenlaceDelGenerador('cualquier cosa', 1).sesion).toBeUndefined()
  })
})
