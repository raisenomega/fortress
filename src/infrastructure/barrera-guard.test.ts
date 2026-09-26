import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import type { OperationMode } from '@domain/settings/operation-mode'
import { BARRERA_ROTA, editaElChat, guardBarrera } from './barrera-guard'
import { banco, conHooks, pathSinPython, restaurarPath, ROTO, SANO, unCliente } from './barrera-guard-fixture' // prettier-ignore

const conBarrera = (comando: string, modo: OperationMode): AppContext =>
  banco(unCliente(conHooks(comando)), modo)

const CLI = (): boolean => true
const API = (): boolean => false

beforeAll(pathSinPython)
afterAll(restaurarPath)

describe('FAIL-CLOSED (ADR-105): un turno que EDITA no corre con la barrera muerta', () => {
  it('lo NIEGA, y dice por que — con el interprete que falta y el que si existe', () => {
    // El motivo se PERSISTE (parte del lote, recibo del Ejecutor): lo escrito
    // tiene que bastar solo, sin ir a buscar que interprete era.
    expect(guardBarrera(conBarrera(ROTO, 'autonomo'), 'p1', true)).toBe(
      `${BARRERA_ROTA} Rota: PreToolUse (Write|Edit|MultiEdit) llama a «python» protect-invariants.py, que no existe; existe «python3».`
    )
  })

  it('con la barrera SANA, edita', () => {
    expect(guardBarrera(conBarrera(SANO, 'autonomo'), 'p1', true)).toBeNull()
  })

  it('un turno que NO edita pasa: hay un humano delante y decide el', () => {
    expect(guardBarrera(conBarrera(ROTO, 'supervisado'), 'p1', false)).toBeNull()
  })

  it('un proyecto que ya no existe no bloquea nada', () => {
    expect(guardBarrera(banco([], 'autonomo'), 'p1', true)).toBeNull()
  })
})

describe('editaElChat: lo que hace que el turno del chat cuente como «edita»', () => {
  it('autonomo en la BASE y turno por el CLI: edita, sea suelto, lote o workflow', () => {
    expect(editaElChat(conBarrera(ROTO, 'autonomo'), CLI)).toBe(true)
  })

  it('supervisado no edita', () => {
    expect(editaElChat(conBarrera(ROTO, 'supervisado'), CLI)).toBe(false)
  })

  it('por API no toca el disco: no edita aunque el proyecto corra en autonomo', () => {
    expect(editaElChat(conBarrera(ROTO, 'autonomo'), API)).toBe(false)
  })

  it('el modo sale de la BASE: no recibe el input, asi que no hay mensaje al que creerle', () => {
    // El turno de plan del lote manda `supervisado` a proposito en un proyecto
    // autonomo. La firma no admite el input: fiarse del mensaje ya no es posible.
    expect(editaElChat.length).toBe(1)
  })
})
