import { describe, expect, it } from 'vitest'
import { con, NADA } from './evidencia-fixture'
import { modulosAplicables, pendientesDeJuicio } from './modulos-aplicables'
import { parseJuicio } from './juicio-parse'
import type { VeredictoAplicabilidad } from './veredicto-de-aplicabilidad'

const juicio = (aplica: 'si' | 'no' | 'no-consta', porque: string): VeredictoAplicabilidad[] => [
  { modulo: 'M8', aplica, porque }
]
const cajaDe = (veredictos: VeredictoAplicabilidad[]): string => {
  const v = modulosAplicables(NADA, {}, veredictos)
  if (v.aplicables.includes('M8')) return 'aplicables'
  return v.descartados.some((d) => d.modulo === 'M8') ? 'descartados' : 'sinConstancia'
}

describe('prosa sin evidencia no cuenta (ADR-081, hecho codigo)', () => {
  it('un "si" CON cita de codigo mueve el modulo', () => {
    expect(cajaDe(juicio('si', 'src/pay/charge.ts:42'))).toBe('aplicables')
  })

  it('un "si" con PROSA no lo mueve: vuelve a no consta', () => {
    expect(cajaDe(juicio('si', 'el sistema claramente cobra a los usuarios'))).toBe('sinConstancia')
  })

  it.each(['ver el modulo de pagos', 'src/pay/charge.ts', 'linea 42', '', 'lo dice el README'])(
    '«%s» no es una cita comprobable',
    (porque) => {
      expect(cajaDe(juicio('si', porque))).toBe('sinConstancia')
    }
  )

  it('un "no" CON cita descarta, y la razon transcribe la prueba', () => {
    const { descartados } = modulosAplicables(NADA, {}, juicio('no', 'src/index.ts:1'))

    expect(descartados.find((d) => d.modulo === 'M8')?.razon).toContain('src/index.ts:1')
  })

  it('un "no-consta" no mueve nada, traiga cita o no', () => {
    expect(cajaDe(juicio('no-consta', 'src/pay/charge.ts:42'))).toBe('sinConstancia')
  })
})

describe('el bloque del clasificador', () => {
  it('se lee como el de OMEGA, delimitado', () => {
    const salida = 'bla\nAPLICA:[{"modulo":"M8","aplica":"si","porque":"a.ts:1"}]:END-APLICA\nbla'

    expect(parseJuicio(salida)).toEqual([{ modulo: 'M8', aplica: 'si', porque: 'a.ts:1' }])
  })

  it('una entrada rota se cae SOLA: no se lleva la buena por delante', () => {
    const salida =
      'APLICA:[{"modulo":"M99","aplica":"si","porque":"a.ts:1"},{"modulo":"M3","aplica":"no","porque":"b.ts:2"}]:END-APLICA' // prettier-ignore

    expect(parseJuicio(salida).map((v) => v.modulo)).toEqual(['M3'])
  })

  it('sin bloque, o con JSON roto, no hay juicio: lista vacia', () => {
    expect(parseJuicio('el proyecto si toca dinero')).toEqual([])
    expect(parseJuicio('APLICA:[roto]:END-APLICA')).toEqual([])
  })
})

describe('la cascada dice a quien hay que juzgar', () => {
  it('sin pasarela y sin declaracion, quedan M3 y M8', () => {
    expect(pendientesDeJuicio(con(['package.json']))).toEqual(['M3', 'M8'])
  })

  it('con stripe, M8 ya esta resuelto: solo queda M3', () => {
    expect(pendientesDeJuicio(con(['package.json'], ['stripe']))).toEqual(['M3'])
  })

  it('declarados los dos, no queda nadie: el spawn no tiene a quien juzgar', () => {
    expect(pendientesDeJuicio(NADA, { M3: true, M8: false })).toEqual([])
  })
})
