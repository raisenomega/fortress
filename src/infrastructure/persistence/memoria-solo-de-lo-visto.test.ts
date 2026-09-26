import { describe, expect, it } from 'vitest'
import { cerrarSinParadas } from './cierre-sin-paradas-fixture'
import { crearBench } from './cierre-partido-fixture'
import { abrirRecorrido } from './paradas-fixture'

/**
 * Un escaneo solo afirma lo que VIO. Con cero paradas terminadas no vio nada, y
 * sin embargo escribia en el COGNITION-LOG del proyecto «Escaneo de seguridad:
 * sin hallazgos. Score 100/100». Medido en el repo propio: 31 de 59 sesiones
 * eran eso, una por cada gate (la suite registra el repo con su ruta real, el
 * escaneo nace parado y se cierra con 0 paradas).
 */
describe('la memoria del proyecto solo se escribe con lo visto', () => {
  it.each(['abortado', 'fallo', 'timeout'] as const)(
    'con CERO paradas hechas (%s) NO escribe reflexion',
    (motivo) => {
      const bench = crearBench()
      cerrarSinParadas(bench, motivo)

      expect(bench.escrituras()).toBe(0)
    }
  )

  it('DETENIDO a mitad con una parada hecha SI escribe lo que vio: la memoria buena se conserva', async () => {
    const r = abrirRecorrido(3)
    await r.guardarLasTres()
    r.cerrar('abortado', 1)

    expect(r.bench.escrituras()).toBe(1)
  })

  it('completo escribe como hoy', async () => {
    const r = abrirRecorrido(3)
    await r.guardarLasTres()
    r.cerrar('completo')

    expect(r.bench.escrituras()).toBe(1)
  })
})
