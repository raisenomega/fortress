import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import { AUTONOMY_RULES_FILES } from '@domain/repair/auto-merge-blacklist'
import type { OperationMode } from '@domain/settings/operation-mode'
import { BARRERA_ROTA, guardBarrera } from './barrera-guard'
import { banco, conHooks, lote, pathSinPython, restaurarPath, ROTO, SANO, unCliente } from './barrera-guard-fixture' // prettier-ignore

const conBarrera = (comando: string, modo: OperationMode): AppContext =>
  banco(unCliente(conHooks(comando)), modo)

beforeAll(pathSinPython)
afterAll(restaurarPath)

describe('FAIL-CLOSED: el lote autonomo no corre con la barrera muerta', () => {
  it('lo NIEGA, y dice por que', () => {
    expect(guardBarrera(conBarrera(ROTO, 'autonomo'), lote())).toBe(BARRERA_ROTA)
  })

  it('con la barrera SANA, pasa', () => {
    expect(guardBarrera(conBarrera(SANO, 'autonomo'), lote())).toBeNull()
  })

  it('EN SUPERVISADO NO bloquea: hay un humano delante y decide el', () => {
    expect(guardBarrera(conBarrera(ROTO, 'supervisado'), lote())).toBeNull()
  })

  it('el modo sale de la BASE, no del mensaje que trae el renderer', () => {
    // El turno de plan del lote manda `supervisado` a proposito en un proyecto
    // autonomo. Fiarse del mensaje seria preguntarle al que quiere pasar.
    const ctx = conBarrera(ROTO, 'autonomo')

    expect(guardBarrera(ctx, lote({ mode: 'supervisado' }))).toBe(BARRERA_ROTA)
  })

  it('un turno SUELTO no es un lote: pasa, y el docblock lo dice', () => {
    const suelto = lote({ lote: undefined, findingId: undefined })

    expect(guardBarrera(conBarrera(ROTO, 'autonomo'), suelto)).toBeNull()
  })

  it('un proyecto que ya no existe no bloquea nada', () => {
    expect(guardBarrera(banco([], 'autonomo'), lote())).toBeNull()
  })
})

describe('y el auto-merge no puede integrar un fix que la desactive', () => {
  it('las DOS mitades estan en la lista innegociable', () => {
    // `innegociables-derivados` deriva sola la puerta —casa con `guard\w+`—
    // pero NO el pre-vuelo, que no exporta ninguna guarda. Un fix que hiciera
    // `barrerasDelProyecto` devolver siempre vacio apagaria el fail-closed
    // entero sin tocar la puerta, y entraria sin que nadie lo viera.
    for (const mitad of ['barrera-guard.ts', 'project/barreras-del-proyecto.ts']) {
      expect(AUTONOMY_RULES_FILES).toContain(`src/infrastructure/${mitad}`)
    }
  })
})
