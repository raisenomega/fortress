import { describe, expect, it } from 'vitest'
import { cadenaConDosVueltas } from './collect-post-omega-fixture'
import { collectPostOmegaState } from './collect-post-omega-state'

/**
 * El expediente de una propuesta que dio DOS vueltas del lazo (ADR-110 §6).
 *
 * Sale a su fichero porque es OTRO sujeto: su hermano prueba que el expediente
 * esta entero o no esta; esto prueba de QUE VUELTA sale cada pieza, que es la
 * pregunta que la arista inventa.
 */
describe('collectGateOutcome con DOS vueltas del lazo (ADR-110 §6)', () => {
  it('lee el cierre de la ULTIMA vuelta, no el primero que encuentra', () => {
    const gate = collectPostOmegaState(cadenaConDosVueltas())?.gate
    expect(gate?.commands.map((c) => c.command)).toEqual(['npm ci', 'typecheck'])
  })

  it('no MEZCLA los comandos de las dos vueltas: son cuatro en el libro y dos suyos', () => {
    const libro = cadenaConDosVueltas()
    expect(libro.filter((e) => e.phase === 'GATE' && e.eventType === 'AGENT_RUN')).toHaveLength(4)
    expect(collectPostOmegaState(libro)?.gate.commands).toHaveLength(2)
  })

  it('y el tiempo que sale es el de SU vuelta, no el de la anterior', () => {
    const gate = collectPostOmegaState(cadenaConDosVueltas())?.gate
    expect(gate?.commands.map((c) => c.durationMs)).toEqual([31_000, 12_000])
  })

  it('el expediente entero sale de la ULTIMA vuelta: su commit y su veredicto', () => {
    const s = collectPostOmegaState(cadenaConDosVueltas())
    expect(s?.commitSha).toBe('fix2222')
    expect(s?.omega.razon).toBe('ahora si, completo')
    // Y la rama sigue siendo la del worktree, que se creo UNA vez.
    expect(s?.branch).toBe('repair/p-1-slug')
  })
})
