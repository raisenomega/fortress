import { describe, expect, it } from 'vitest'
import { bench, hallazgo, type Bench, type Opciones } from './plan-repair-fixture'
import { verificarMitigado } from './verificar-mitigado'
import type { DictamenDeVerificacion } from '@domain/repair/dictamen-de-verificacion'
import type { FindingMemory } from '@domain/project/finding-memory'

const MITIGADO: FindingMemory = {
  ...hallazgo('f1', 'src/api.ts'),
  lifecycle: 'MITIGATED',
  mitigatedAt: '2026-09-01T10:00:00Z'
}

const base: Opciones = { findings: [MITIGADO], sha: 'abc123' }

/** El fix del operador SI dejo huella comprobable en el fichero. */
const PROBADO: Opciones = {
  ...base,
  verdictStatus: 'OBSOLETO',
  evidencia: { marcador: 'execFile(', forma: 'ausente' },
  contenido: 'await runCommand("npm", ["run", "typecheck"])'
}

async function corrida(
  opts: Opciones
): Promise<{ banco: Bench; dictamen: DictamenDeVerificacion | null }> {
  const banco = bench(opts)
  const dictamen = await verificarMitigado(banco.context, 'p1', 'f1')
  return { banco, dictamen }
}

describe('verificar un mitigado no pasa por la lista de propuestas', () => {
  it('SIN PROPOSAL: no inserta, no parchea y no asienta un evento de propuesta', async () => {
    // Una propuesta que nunca quiso reparar miente sobre la intencion y ensucia
    // la vista donde el operador mira lo que tiene pendiente de firmar.
    const { banco } = await corrida(PROBADO)

    expect(banco.inserted).toHaveLength(0)
    expect(banco.patches).toHaveLength(0)
    expect(banco.events).toHaveLength(0)
  })

  it('pero lo que el analista noto de FORTRESS SI se guarda, como en el otro camino', async () => {
    const notes = [{ kind: 'gap', area: 'motor-de-reparacion', note: 'no vi el fichero' }] as never
    const { banco } = await corrida({ ...PROBADO, notes })

    expect(banco.observadas).toHaveLength(1)
  })

  /** INC-3/A: el fix de un append-only cierra en OTRO fichero; la puerta decide. */
  const CITA = {
    ...base,
    verdictStatus: 'OBSOLETO' as const,
    evidencia: { marcador: 'drop policy', forma: 'presente' as const, file: 'supabase/migrations/nueva.sql' },
    contenido: 'drop policy "anon upload" on storage.objects'
  }

  it('(a) cita un fichero que el arreglo SI toco + presente → EXTINCT', async () => {
    const { banco } = await corrida({ ...CITA, tocado: true })
    expect(banco.extinguidos.map((e) => e.ids)).toEqual([['f1']])
  })

  it('(b) CLAVE: cita un fichero AJENO (el fix NO lo toco) → MITIGATED, no EXTINCT', async () => {
    // Mutar "quitar la puerta" (pasar evidencia.file directo a extinguir) cerraria
    // este ajeno —el marcador cuadra en el contenido— y este test moriria.
    const { banco } = await corrida({ ...CITA, tocado: false })
    expect(banco.extinguidos).toEqual([])
    expect(banco.mitigados.length).toBeGreaterThan(0)
  })

  it('INC-A: fix committeado en un turno ANTERIOR (baseDelFoco) + tocado → EXTINCT', async () => {
    // DROP committeado turnos atras; sha:null = el turno no lo veria → solo cierra con baseDelFoco.
    const { banco } = await corrida({ ...CITA, baseFoco: 'base-del-foco', tocado: true, sha: null })
    expect(banco.extinguidos.map((e) => e.ids)).toEqual([['f1']])
  })
})
