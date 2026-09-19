import { describe, expect, it } from 'vitest'
import { etiquetaDeFase } from './fase-del-turno'

/**
 * ADR-097, punto 2. Lo que el operador lee cuando el turno entra en debate. En
 * el ensayo del 18-sep miro seis minutos de cronometro sin saber que un critico
 * estaba navegando su codigo por $1.93.
 */
describe('la etiqueta del debate', () => {
  it('dice DEBATE y cuantos agentes', () => {
    expect(etiquetaDeFase('debate', 3)).toBe('Debate · 3 agentes')
  })

  it('el numero es el de los agentes del turno, no el de criticos', () => {
    // El debate es cosa de los tres: el productor propuso, el critico ataca y
    // OMEGA arbitrara. Contar solo a quien ataca contaria mal la conversacion.
    expect(etiquetaDeFase('debate', 3)).toContain('3')
  })

  it('no dice el color: eso lo decide la presentacion', () => {
    // Un dominio que dijera «naranja» no podria cambiar de tema sin mentir.
    const texto = etiquetaDeFase('debate', 3)
    expect(texto).not.toMatch(/naranja|orange|text-|#|hsl/i)
  })
})
