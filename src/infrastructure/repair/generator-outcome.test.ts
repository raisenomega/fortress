import { describe, expect, it } from 'vitest'
import { argsDelGenerador, MAX_TURNS } from './generator-args'
import { desenlaceDelGenerador } from './generator-outcome'

const salida = (extra: Record<string, unknown>): string =>
  JSON.stringify({
    type: 'result',
    total_cost_usd: 1.5,
    num_turns: 30,
    usage: { input_tokens: 40, output_tokens: 20_000, cache_read_input_tokens: 900_000 },
    ...extra
  })

describe('el techo de turnos', () => {
  it('esta calibrado con los datos: sobre las que completaban, bajo las que divagaban', () => {
    // Completaron en 4-25 vueltas; reventaron el tope con 32, 35, 44 y 50.
    expect(MAX_TURNS).toBeGreaterThan(25)
    expect(MAX_TURNS).toBeLessThan(32)
  })

  it('el generador se lanza CON el techo puesto', () => {
    const args = argsDelGenerador('arregla esto')
    expect(args).toContain('--max-turns')
    expect(args[args.indexOf('--max-turns') + 1]).toBe(String(MAX_TURNS))
  })

  it('sigue lanzandose sin Bash: el commit y el gate son del motor', () => {
    const tools = argsDelGenerador('x')[argsDelGenerador('x').indexOf('--allowedTools') + 1]
    expect(tools).toContain('Edit')
    expect(tools.split(',')).not.toContain('Bash')
  })
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
    expect(fin.usage.outputTokens).toBe(20_000)
    expect(fin.usage.numTurns).toBe(30)
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

  it('sin JSON no se inventa factura', () => {
    const fin = desenlaceDelGenerador('cualquier cosa', 1)
    expect(fin.usage.outputTokens).toBe(0)
  })
})
