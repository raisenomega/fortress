import { describe, expect, it } from 'vitest'
import { bench, hallazgo } from './plan-repair-fixture'
import { planRepair } from './plan-repair'

describe('un hallazgo solo muere si un agente lo ha mirado Y pudo probarlo', () => {
  it('veredicto OBSOLETO con prueba: se extingue, y queda escrito POR QUE', async () => {
    // Que un agente lo haya mirado ya no basta: mirar y acertar no son lo mismo,
    // y de ocho juicios reales uno cerro un hallazgo que seguia vivo.
    const b = bench({
      findings: [hallazgo('f1', 'a.ts')],
      verdictStatus: 'OBSOLETO',
      evidencia: { marcador: 'execFile(', forma: 'ausente' },
      contenido: 'await runCommand(...)'
    })
    await planRepair(b.context, 'p1')

    expect(b.extinguidos).toHaveLength(1)
    expect(b.extinguidos[0].ids).toEqual(['f1'])
    expect(b.extinguidos[0].motivo).toBe('juicio_obsoleto')
  })

  it('veredicto REAL: sigue vivo, que para eso se va a reparar', async () => {
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'REAL' })
    await planRepair(b.context, 'p1')

    expect(b.extinguidos).toEqual([])
  })

  it('ILEGIBLE no mata: un JSON truncado no es una opinion sobre el hallazgo', async () => {
    // Sin esto, el fallo de parseo que cp113 dejo de disfrazar de obsoleto
    // habria vuelto por la puerta de atras, cerrando el hallazgo igualmente.
    const b = bench({ findings: [hallazgo('f1', 'a.ts')], verdictStatus: 'ILEGIBLE' })
    await planRepair(b.context, 'p1')

    expect(b.extinguidos).toEqual([])
  })

  it('sin candidato no se toca nada', async () => {
    const b = bench({ findings: [] })
    await planRepair(b.context, 'p1')

    expect(b.extinguidos).toEqual([])
  })
})

describe('INC-3: el Motor NO pasa por la puerta touched-by-fix', () => {
  it('REGRESION byte-identica: ignora evidencia.file y lee el ANCLA, sin puerta', async () => {
    // El Motor planifica ANTES de que exista el fix: la puerta touched-by-fix NO
    // aplica (vive en verificarMitigado). Aunque el analista cite OTRO fichero, se
    // cierra leyendo el ancla, como antes del feature. Si alguien mete la puerta
    // aqui, el bench responde tocado=false por defecto y dejaria de extinguir →
    // este test moriria.
    const b = bench({
      findings: [hallazgo('f1', 'a.ts')],
      verdictStatus: 'OBSOLETO',
      evidencia: { marcador: 'execFile(', forma: 'ausente', file: 'otra/migracion.sql' },
      contenido: 'await runCommand(...)'
    })
    await planRepair(b.context, 'p1')

    expect(b.extinguidos.map((e) => e.ids)).toEqual([['f1']])
  })
})
