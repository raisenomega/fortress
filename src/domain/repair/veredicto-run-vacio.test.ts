import { describe, expect, it } from 'vitest'
import type { Analysis } from './analysis'
import { RUN_VACIO } from './run-vacio'
import { isRejectionReason } from './repair-rejection'
import { isRetryable } from './retry-eligibility'
import { veredictoDelAnalisis } from './veredicto-del-analisis'

/** Un Analysis con solo su marca de riesgo: lo que el parser deja al degradar. */
const conMarca = (risk: string): Analysis =>
  ({ target: { id: 'f1' }, status: 'DESCONOCIDO', whatToChange: '', where: '', patternToCopy: '', doNotTouch: '', risk, tokensUsed: 0 }) as unknown as Analysis // prettier-ignore

describe('veredicto del run-vacío (GAP B): honesto, NO ilegible', () => {
  it('el modelo no corrió → verdict RUN_VACIO, RECHAZADO y motivo honesto', () => {
    // El pecado que GAP B mata: antes decia "ilegible" (supone respuesta) cuando
    // la verdad es que el modelo no corrio. Mutante: quitar la rama runVacio en
    // veredicto-del-analisis.ts -> cae a OBSOLETO/ILEGIBLE -> este test ROJO.
    const v = veredictoDelAnalisis(conMarca(RUN_VACIO))
    expect([v.verdict, v.state]).toEqual(['RUN_VACIO', 'RECHAZADO'])
    expect(v.reason).toBe('run_vacio: el modelo no corrio')
    expect(v.verdict).not.toBe('ILEGIBLE')
  })

  it('run_vacio es rechazo del vocabulario y reintentable (la línea FIRMADA tiene dientes)', () => {
    const v = veredictoDelAnalisis(conMarca(RUN_VACIO))
    expect(isRejectionReason(v.reason.split(':')[0])).toBe(true)
    expect(isRetryable('RECHAZADO', v.reason)).toBe(true)
  })
})
