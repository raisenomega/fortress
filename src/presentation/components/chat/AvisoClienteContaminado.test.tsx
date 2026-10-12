import { describe, expect, it } from 'vitest'
import type { ProyectoEnVista } from '@domain/project/proyecto-en-vista'
import { AvisoClienteContaminado } from './AvisoClienteContaminado'

/** PASO 172a: aviso NO bloqueante SOLO para un cliente contaminado. FORTRESS va
 *  por el freeze del Motor; un cliente limpio no ve nada. */
const con = (o: Partial<ProyectoEnVista>): ProyectoEnVista =>
  ({ contaminated: false, esRepoPropio: false, contaminationDetail: null, ...o }) as ProyectoEnVista

describe('AvisoClienteContaminado', () => {
  it('cliente contaminado → muestra el aviso (no null)', () => {
    expect(AvisoClienteContaminado({ project: con({ contaminated: true }) })).not.toBeNull()
  })

  it('FORTRESS contaminado → null (va por el Motor, no este aviso)', () => {
    const p = con({ contaminated: true, esRepoPropio: true })
    expect(AvisoClienteContaminado({ project: p })).toBeNull()
  })

  it('cliente limpio → null', () => {
    expect(AvisoClienteContaminado({ project: con({ contaminated: false }) })).toBeNull()
  })
})
