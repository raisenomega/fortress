import { describe, expect, it } from 'vitest'
import type { FileHistory } from '@domain/project/file-history'
import type { FindingMemory } from '@domain/project/finding-memory'
import { decideConservados } from './conservar-mitigado'

const MARCA = '2026-08-21T02:00:00Z'

/** El caso real: el hallazgo vive en un fichero y su arreglo en otro. */
const hallazgo = (extra: Partial<FindingMemory> = {}): FindingMemory =>
  ({
    id: 'f1', identity: 'HIGH|repair-gate-handler.ts|el gate no exige confianza',
    severity: 'HIGH', title: 'el gate no exige confianza',
    file: 'src/infrastructure/ipc/repair-gate-handler.ts', line: 19,
    status: 'open', lifecycle: 'MITIGATED', firstSeen: MARCA, lastSeen: MARCA,
    resolvedAt: null, mitigatedAt: MARCA, ...extra
  }) as FindingMemory // prettier-ignore

/** `changedSince` no lanza: ante duda —no hay git, git fallo, fecha ilegible—
 *  responde false. Aqui ese false CONSERVA la marca; en la extincion, el mismo
 *  false impide cerrar. Lados opuestos, los dos conservadores. */
const git = (cambio: boolean): FileHistory => ({
  changedSince: () => Promise.resolve(cambio),
  tocadoPorElArreglo: () => Promise.resolve(false),
  baseDelFoco: () => Promise.resolve(null),
  ficherosConMarcadorNacido: () => Promise.resolve([])
})

const decidir = (f: FindingMemory, cambio: boolean): Promise<ReadonlySet<string>> =>
  decideConservados(git(cambio), '/repo', [f], new Set([f.identity]))

describe('un hallazgo mitigado sobrevive al escaneo que lo vuelve a ver', () => {
  it('su fichero no cambio desde la marca: se conserva', async () => {
    // El escaner lo sigue viendo, que es justo lo que la marca reconoce.
    expect([...(await decidir(hallazgo(), false))]).toEqual(['f1'])
  })

  it('su fichero cambio desde la marca: vuelve a ACTIVE', async () => {
    expect([...(await decidir(hallazgo(), true))]).toEqual([])
  })

  it('un ACTIVE normal nunca se conserva: el TOUCH de siempre manda', async () => {
    const activo = hallazgo({ lifecycle: 'ACTIVE', mitigatedAt: null })
    expect([...(await decidir(activo, false))]).toEqual([])
  })

  it('mitigado pero AUSENTE del escaneo: no se conserva, que decida la extincion', async () => {
    const fuera = await decideConservados(git(false), '/repo', [hallazgo()], new Set())
    expect([...fuera]).toEqual([])
  })

  it('sin fecha de marca no se puede comprobar nada, y no se conserva', async () => {
    expect([...(await decidir(hallazgo({ mitigatedAt: null }), false))]).toEqual([])
  })

  it('ante duda de git (false) se respeta la marca del operador', async () => {
    // Es el MISMO false que en la extincion impide cerrar un hallazgo. Alli no
    // cerrar es lo conservador; aqui lo conservador es no deshacer lo que un
    // humano declaro. Alinear los dos lados romperia uno de ellos.
    expect([...(await decidir(hallazgo(), false))]).toEqual(['f1'])
  })
})
