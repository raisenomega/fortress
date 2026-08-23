import { describe, expect, it } from 'vitest'
import type { FindingMemory } from '@domain/project/finding-memory'
import type { ConfigState } from '@domain/repair/auto-merge-config'
import { DEFAULT_POLICY } from '@domain/repair/auto-merge-policy'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'

/** El cerco de este repo: solo LOW y con `ipc/**` excluido. */
const CERCO: ConfigState = {
  kind: 'valid',
  policy: { ...DEFAULT_POLICY, enabled: true, severities: ['LOW'], blacklist: ['src/infrastructure/ipc/**'] } // prettier-ignore
}

const con = (id: string, file: string, extra: Partial<FindingMemory> = {}): FindingMemory => ({
  ...hallazgo(id, file),
  title: 'falta la guarda de entrada',
  ...extra
})

const MEDIO = con('f-medio', 'src/application/a.ts', { severity: 'MEDIUM' })
const ALTO = con('f-alto', 'src/application/b.ts', { severity: 'HIGH' })
const DEFENSA = con('f-defensa', 'src/infrastructure/run-guard.ts')

const elegido = async (
  findings: readonly FindingMemory[],
  modo?: 'hasta-omega'
): Promise<string> => {
  const b = bench({ findings, cerco: CERCO })
  const p =
    modo === undefined
      ? await planRepair(b.context, 'p1')
      : await planRepair(b.context, 'p1', undefined, modo)
  return p?.findingId ?? 'ninguno'
}

describe('la cola elige con el alcance de su vuelta', () => {
  it('en hasta-omega elige un MEDIUM que el cerco denegaria', async () => {
    // Nada se integra en ese modo, asi que la severidad no protege de nada.
    expect(await elegido([MEDIO], 'hasta-omega')).toBe('f-medio')
  })

  it('en completo NO lo elige: esa vuelta si podria integrarlo sola', async () => {
    expect(await elegido([MEDIO])).toBe('ninguno')
  })

  it('una defensa del motor no se elige en NINGUN modo', async () => {
    expect(await elegido([DEFENSA], 'hasta-omega')).toBe('ninguno')
    expect(await elegido([DEFENSA])).toBe('ninguno')
  })

  it('un HIGH sigue fuera: lo para el estreno, no el alcance', async () => {
    // `puedeTrabajarse` lo admitiria; DEBUT no. Ampliar el estreno es otra
    // decision, y esta pieza no la toma de rebote.
    expect(await elegido([ALTO], 'hasta-omega')).toBe('ninguno')
  })
})
