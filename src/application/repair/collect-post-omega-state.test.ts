import { describe, expect, it } from 'vitest'
import { cadenaCompleta, cadenaConDosVueltas, cadenaSin, evento, VERDICT } from './collect-post-omega-fixture'
import { collectPostOmegaState } from './collect-post-omega-state'
import { MOTIVO_WORKTREE } from '@domain/repair/motivo-del-worktree'

describe('collectPostOmegaState: el expediente entero o nada', () => {
  it('con la cadena completa devuelve los ocho campos', () => {
    const s = collectPostOmegaState(cadenaCompleta())
    expect(s).not.toBeNull()
    expect(s).toMatchObject({
      branch: 'repair/p-1-slug',
      baseSha: 'base123',
      commitSha: 'fix9876',
      files: ['src/a.ts'],
      insertions: 6,
      deletions: 2,
      omega: VERDICT
    })
  })

  it('cada pieza que falte devuelve null: un expediente a medias no es expediente', () => {
    expect(collectPostOmegaState(cadenaSin('GENERATE', 'DECISION'))).toBeNull()
    expect(collectPostOmegaState(cadenaSin('GENERATE', 'TRANSITION'))).toBeNull()
    expect(collectPostOmegaState(cadenaSin('GATE', 'AGENT_RUN'))).toBeNull()
    expect(collectPostOmegaState(cadenaSin('GATE', 'TRANSITION'))).toBeNull()
    expect(collectPostOmegaState(cadenaSin('OMEGA', 'TRANSITION'))).toBeNull()
  })

  it('la rama se LEE del libro, no se recompone del patron', () => {
    // Una rama que no sigue la convencion se devuelve tal cual: es la que existe.
    const raros = cadenaCompleta().map((e) =>
      e.phase === 'GENERATE' && e.eventType === 'DECISION'
        ? evento('GENERATE', 'DECISION', { branch: 'otra-convencion', baseSha: 'b', ok: true }, { reason: MOTIVO_WORKTREE }) // prettier-ignore
        : e
    )
    expect(collectPostOmegaState(raros)?.branch).toBe('otra-convencion')
  })

  it('una evidencia corrupta no revienta: cae a null', () => {
    const rotos = cadenaCompleta().map((e) =>
      e.phase === 'OMEGA' ? { ...e, evidenceJson: '{ roto' } : e
    )
    expect(() => collectPostOmegaState(rotos)).not.toThrow()
    expect(collectPostOmegaState(rotos)).toBeNull()
  })
})

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

describe('collectPostOmegaState: el gate reunido', () => {
  it('incluye TODOS los comandos, en el orden en que corrieron', () => {
    const gate = collectPostOmegaState(cadenaCompleta())?.gate
    expect(gate?.commands.map((c) => c.command)).toEqual(['npm ci', 'lint'])
  })

  it('el tiempo de cada comando sale del evento, no de su evidencia', () => {
    const gate = collectPostOmegaState(cadenaCompleta())?.gate
    expect(gate?.commands.map((c) => c.durationMs)).toEqual([29_000, 35_000])
  })

  it('el veredicto lo dicta el cierre, no se recalcula', () => {
    expect(collectPostOmegaState(cadenaCompleta())?.gate.ok).toBe(true)
  })
})
