import { describe, expect, it } from 'vitest'
import type { ResultadoVerificacionMasiva } from '@domain/repair/verificacion-masiva'
import { parteDeLaVerificacion } from './parte-de-la-verificacion'

const parte = (over: Partial<ResultadoVerificacionMasiva>): ResultadoVerificacionMasiva => ({
  fin: 'completado',
  total: 26,
  extinguidos: 0,
  sinPrueba: 0,
  siguenVivos: 0,
  noMitigados: 0,
  yaTrabajados: 0,
  sinClasificar: 0,
  ...over
})

describe('la cobertura declarada del barrido', () => {
  it('dice cuantos de cuantos y a donde fue cada uno', () => {
    const { texto } = parteDeLaVerificacion(
      parte({ fin: 'detenido', extinguidos: 3, sinPrueba: 1, siguenVivos: 2 })
    )

    expect(texto).toContain('Verifique 6 de 26 · lo detuviste')
    expect(texto).toContain('3 extinguidos -> Historia')
    expect(texto).toContain('1 sin prueba')
    expect(texto).toContain('2 siguen vivos -> cola')
  })

  it('cortado no es verde: pintarlo afirmaria que se reviso lo que nadie reviso', () => {
    expect(parteDeLaVerificacion(parte({ fin: 'detenido', extinguidos: 1 })).tono).toBe('aviso')
    expect(parteDeLaVerificacion(parte({ fin: 'completado', extinguidos: 26 })).tono).toBe('ok')
  })

  it('ocupado es aviso, no error: es un freno del sistema, no una averia', () => {
    const { texto, tono } = parteDeLaVerificacion(
      parte({ fin: 'ocupado', total: 0, detalle: 'Ya hay una ejecucion en marcha' })
    )

    expect(tono).toBe('aviso')
    expect(texto).toContain('Ya hay una ejecucion en marcha')
  })

  it('una averia SI es error, y lleva su motivo pegado', () => {
    const roto = parte({ fin: 'averia', extinguidos: 2, detalle: 'el CLI no arranca' })

    expect(parteDeLaVerificacion(roto)).toMatchObject({ tono: 'error' })
    expect(parteDeLaVerificacion(roto).texto).toContain('el CLI no arranca')
  })
})

describe('el parte solo nombra lo que paso', () => {
  it('las casillas vacias no se nombran: un parte lleno de ceros no se lee', () => {
    const { texto } = parteDeLaVerificacion(parte({ extinguidos: 26 }))

    expect(texto).toContain('26 extinguidos -> Historia')
    expect(texto).not.toContain('sin prueba')
  })

  it('el omitido no cuenta como verificado: a ese no lo miro nadie', () => {
    const r = parte({ fin: 'detenido', extinguidos: 1, yaTrabajados: 1 })

    expect(parteDeLaVerificacion(r).texto).toContain('Verifique 1 de 26')
    expect(parteDeLaVerificacion(r).texto).toContain('1 sin verificar: ya lo trabaja una propuesta')
  })

  it('los dos motivos de omision NO se funden: uno no aplicaba, el otro esta cogido', () => {
    // Con una sola casilla, seleccionar a mano un hallazgo no mitigado se
    // anunciaba como «ya lo trabaja una propuesta»: falso sobre algo intacto.
    const { texto } = parteDeLaVerificacion(parte({ noMitigados: 2, yaTrabajados: 1 }))

    expect(texto).toContain('2 sin verificar: no estaban mitigados')
    expect(texto).toContain('1 sin verificar: ya lo trabaja una propuesta')
  })
})
