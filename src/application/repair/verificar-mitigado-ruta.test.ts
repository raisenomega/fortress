import { describe, expect, it } from 'vitest'
import { bench, hallazgo, type Bench, type Opciones } from './plan-repair-fixture'
import { verificarMitigado } from './verificar-mitigado'
import type { FindingMemory } from '@domain/project/finding-memory'

// El control se mudo a un HERMANO; la ruta por conectividad decide. El ancla
// ('src/api.ts') NO trae el marcador; el control vive en 'hermano.ts'.
const MITIGADO: FindingMemory = {
  ...hallazgo('f1', 'src/api.ts'),
  lifecycle: 'MITIGATED',
  mitigatedAt: '2026-09-01T10:00:00Z'
}
const base: Opciones = { findings: [MITIGADO], sha: 'abc123' }
const EV = { marcador: 'drop policy', forma: 'presente' as const }
const CITA: Opciones = { ...base, verdictStatus: 'OBSOLETO', evidencia: { ...EV, file: 'hermano.ts' }, contenido: 'sin marca en el ancla' } // prettier-ignore
const OMITIDO: Opciones = { ...CITA, evidencia: EV }
// El control (drop policy) vive en el hermano; el ancla (src/api.ts) no lo trae.
const enHermano = (f: string): string => (f === 'hermano.ts' ? 'drop policy aqui' : 'sin marca')

async function corrida(opts: Opciones): Promise<Bench> {
  const banco = bench(opts)
  await verificarMitigado(banco.context, 'p1', 'f1')
  return banco
}

describe('verificar: el control vive en la RUTA del hallazgo (conectividad)', () => {
  it('(a) cita un control real (presente+atribuido) Y en ruta → EXTINCT', async () => {
    const banco = await corrida({ ...CITA, controles: ['hermano.ts'], contenidoDe: enHermano })
    expect(banco.extinguidos.map((e) => e.ids)).toEqual([['f1']])
  })

  it('(b) CLAVE: cita presente pero FUERA de la ruta → MITIGATED, no EXTINCT', async () => {
    // La conectividad es obligatoria: mutar "quitarla" (honrar la cita a secas)
    // cerraria este fichero coincidente pero ajeno, y este test moriria.
    const banco = await corrida({ ...CITA, controles: ['hermano.ts'], enRuta: () => false })
    expect(banco.extinguidos).toEqual([])
    expect(banco.mitigados.length).toBeGreaterThan(0)
  })

  it('(c) cobaya: file OMITIDO + UN control en ruta (el hermano) → EXTINCT', async () => {
    const banco = await corrida({ ...OMITIDO, controles: ['hermano.ts'], contenidoDe: enHermano })
    expect(banco.extinguidos.map((e) => e.ids)).toEqual([['f1']])
  })

  it('(d) DIENTE: file omitido + control presente pero FUERA de ruta (decoy) → MITIGATED', async () => {
    const banco = await corrida({ ...OMITIDO, controles: ['decoy.ts'], enRuta: () => false })
    expect(banco.extinguidos).toEqual([])
    expect(banco.mitigados.length).toBeGreaterThan(0)
  })

  it('(e) pan-de-cada-dia: el control vive en el PROPIO ancla (f==ancla) → EXTINCT', async () => {
    // Cortocircuito ANTES de la conectividad: `controles: []` prueba que el caso
    // normal NO depende de la ruta (si no, a escala todo se sobre-conservaria).
    const enAncla = (f: string): string => (f === 'src/api.ts' ? 'drop policy aqui' : 'x')
    const banco = await corrida({ ...OMITIDO, controles: [], contenidoDe: enAncla })
    expect(banco.extinguidos.map((e) => e.ids)).toEqual([['f1']])
  })
})
