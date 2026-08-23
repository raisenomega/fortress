import { describe, expect, it } from 'vitest'
import { reduceMotorStatus } from '@domain/repair/motor-status'
import type { Proposal } from '@domain/repair/proposal'
import { detenido, tituloDetenido } from './motor-chip-look'

const prop = (state: Proposal['state']): Proposal =>
  ({
    id: state,
    projectId: 'p',
    findingId: 'f',
    state,
    baseSha: 'b',
    createdAt: 0,
    updatedAt: 0
  }) as Proposal

describe('el chip del motor solo habla cuando esta parado', () => {
  it('con el proyecto contaminado avisa, y dice por que', () => {
    const parado = detenido(reduceMotorStatus([], true))
    expect(parado).not.toBeNull()
    expect(tituloDetenido(parado?.razon ?? '')).toContain('Motor detenido')
  })

  it('con propuestas esperando NO pinta nada: eso ya lo dice el chip de firma', () => {
    // Contaba "Pendientes: N", y en reposo ese numero es identico al de firma
    // porque toda propuesta viva es una que espera al operador. Dos chips con
    // la misma cifra al lado se leen como dos cosas distintas que no lo son.
    expect(detenido(reduceMotorStatus([prop('OMEGA'), prop('GATE')], false))).toBeNull()
  })

  it('con el motor limpio tampoco: un "todo bien" permanente ensena a no mirar', () => {
    expect(detenido(reduceMotorStatus([], false))).toBeNull()
  })

  it('la contaminacion manda aunque haya propuestas vivas', () => {
    expect(detenido(reduceMotorStatus([prop('OMEGA')], true))).not.toBeNull()
  })
})
