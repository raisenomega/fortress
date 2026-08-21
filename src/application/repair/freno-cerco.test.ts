import { describe, expect, it } from 'vitest'
import type { ConfigState } from '@domain/repair/auto-merge-config'
import { DEFAULT_POLICY } from '@domain/repair/auto-merge-policy'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'
import { resumenCerco } from './resumen-cerco'

/** El cerco real de FORTRESS: solo LOW y con `ipc/**` excluido. */
const CERCO: ConfigState = {
  kind: 'valid',
  policy: { ...DEFAULT_POLICY, enabled: true, severities: ['LOW'], blacklist: ['src/infrastructure/ipc/**'] } // prettier-ignore
}
/** mailbd: declara `.fortress/config` pero sin bloque autoMerge. */
const SIN_CERCO: ConfigState = { kind: 'invalid', reason: 'falta el bloque autoMerge' }

const LIBRE = hallazgo('f-libre', 'src/infrastructure/claude-code/run-accumulator.ts')
const VETADO = hallazgo('f-vetado', 'src/infrastructure/ipc/graph-action-handlers.ts')
const MEDIO = { ...hallazgo('f-medio', 'src/application/a.ts'), severity: 'MEDIUM' as const }

describe('la cola no elige lo que el cerco va a denegar', () => {
  it('un hallazgo cuyo fichero esta excluido no se elige, y no paga analista', async () => {
    const b = bench({ findings: [VETADO], cerco: CERCO })
    expect(await planRepair(b.context, 'p1')).toBeNull()
    expect(b.inserted).toHaveLength(0)
  })

  it('un MEDIUM donde el cerco solo admite LOW tampoco se elige', async () => {
    const b = bench({ findings: [MEDIO], cerco: CERCO })
    expect(await planRepair(b.context, 'p1')).toBeNull()
  })

  it('teniendo los dos delante, elige el que si puede aspirar', async () => {
    const b = bench({ findings: [VETADO, LIBRE], cerco: CERCO })
    expect((await planRepair(b.context, 'p1'))?.findingId).toBe('f-libre')
  })

  it('no-regresion: el LOW fuera de la lista sigue siendo elegible el solo', async () => {
    const b = bench({ findings: [LIBRE], cerco: CERCO })
    expect((await planRepair(b.context, 'p1'))?.state).toBe('ANALIZADO')
  })
})

describe('donde no hay cerco, el freno no aplica', () => {
  it('un proyecto sin bloque autoMerge sigue eligiendo: no se apaga el motor', async () => {
    // Si esto se rompe, mailbd —el unico proyecto con el loop encendido— deja
    // de trabajar en silencio. Sin cerco todo es firma manual por definicion.
    const b = bench({ findings: [VETADO], cerco: SIN_CERCO })
    expect((await planRepair(b.context, 'p1'))?.findingId).toBe('f-vetado')
  })

  it('tampoco aplica si el proyecto no tiene .fortress/config', async () => {
    const b = bench({ findings: [VETADO] })
    expect((await planRepair(b.context, 'p1'))?.findingId).toBe('f-vetado')
  })
})

describe('el operador alcanza a mano lo que la cola descarta', () => {
  it('un dirigido que el cerco denegaria se trabaja igual: nace para firma humana', async () => {
    const b = bench({ findings: [VETADO, LIBRE], cerco: CERCO })
    expect((await planRepair(b.context, 'p1', 'f-vetado'))?.state).toBe('ANALIZADO')
  })
})

describe('el freno dice en voz alta lo que deja fuera', () => {
  it('cuenta los que la cola no puede elegir, sobre el total vivo', () => {
    const b = bench({ findings: [VETADO, LIBRE, MEDIO], cerco: CERCO })
    expect(resumenCerco(b.context, 'p1')).toEqual({ total: 3, fuera: 2 })
  })

  it('sin cerco no hay nadie fuera, y la linea no se pinta', () => {
    const b = bench({ findings: [VETADO, MEDIO], cerco: SIN_CERCO })
    expect(resumenCerco(b.context, 'p1')).toEqual({ total: 2, fuera: 0 })
  })
})
